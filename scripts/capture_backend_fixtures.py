"""Record real AgentPulse responses as the fixtures the contract tests read.

The frontend talks to two services it does not own. This script runs both of
them in-process, sends the requests the frontend sends, and writes what came
back, so the tests compare the client against the backend and not against this
repo's idea of the backend.

    <agentpulse>/.venv/Scripts/python.exe scripts/capture_backend_fixtures.py \\
        --agentpulse <path to an agentpulse checkout>

Needs the agentpulse checkout's own environment (fastapi, sqlmodel, the SDK) and
a checkout that has `demo/chat_server.py` (agentpulse PR #60 or later).

What is real and what is not
  Real     routes, middleware, response shapes, status codes, the chat service,
           the SDK span payloads, the ingest path, the alert engine's messages.
  Stubbed  the language model behind the chat service (a recording fake), and
           the evaluation worker. The worker needs ~1.2 GB of models, so the
           Evaluation, DriftRecord and WorkerHeartbeat rows are inserted
           directly, with plausible values. The numbers in them are made up; the
           shapes the API wraps them in are not.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

KEY = "fixture-key"
AUTH = {"X-API-Key": KEY}

DEFAULT_OUT = Path(__file__).resolve().parent.parent / "src" / "lib" / "__fixtures__" / "backend"


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--agentpulse", required=True, type=Path, help="agentpulse checkout (PR #60 or later)")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="where the fixtures go")
    return ap.parse_args()


def main() -> None:
    args = parse_args()
    root = args.agentpulse.resolve()
    out = args.out.resolve()
    if not (root / "demo" / "chat_server.py").exists():
        sys.exit(f"{root} has no demo/chat_server.py; use agentpulse PR #60 or later")
    out.mkdir(parents=True, exist_ok=True)
    for stale in out.glob("*.json"):
        stale.unlink()

    work = Path(tempfile.mkdtemp(prefix="agentpulse-fixtures-"))
    db = work / "fixtures.db"

    # `settings` and the database engine are built when app.* is first imported,
    # so the environment has to be right before that import.
    os.environ.update(
        {
            "AGENTPULSE_DATABASE_URL": f"sqlite+aiosqlite:///{db.as_posix()}",
            "AGENTPULSE_API_KEY": KEY,
            "AGENTPULSE_LOCAL_DEV_MODE": "true",
        }
    )
    for p in (root / "backend", root / "sdk" / "src", root):
        sys.path.insert(0, str(p))
    os.chdir(root)

    recorded: list[str] = []

    def record(name: str, response) -> dict:
        body = response.json() if response.content else None
        doc = {
            "method": response.request.method,
            "path": response.request.url.path,
            "status": response.status_code,
            "body": body,
        }
        (out / f"{name}.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        recorded.append(name)
        return doc

    from fastapi.testclient import TestClient

    from agentpulse import AgentPulse
    from agentpulse.schemas.events import IngestRequest
    from demo.chat_server import AGENTS, ChatConfig, create_app

    # ── the chat service, with a fake model ──────────────────────────────────

    class _Msg:
        def __init__(self, content):
            self.content = content

    class _Choice:
        def __init__(self, content):
            self.message = _Msg(content)

    class _Usage:
        prompt_tokens = 412
        completion_tokens = 58

    class _Response:
        def __init__(self, content):
            self.choices = [_Choice(content)]
            self.usage = _Usage()

    REPLIES = {
        "fixture-retriever": "I retrieved three documents about agent drift and how it is measured.",
        "fixture-verifier": "The evidence answers the question. The retrieved documents describe drift directly.",
        "fixture-answerer": "Drift is the shift in an agent's behaviour away from its baseline, measured on pooled windows of its outputs.",
    }

    class FakeModel:
        def __init__(self, fail_on=None):
            self.fail_on = fail_on
            self.chat = self
            self.completions = self

        def create(self, model, messages, max_tokens):
            if model == self.fail_on:
                raise RuntimeError("upstream 500")
            return _Response(REPLIES[model])

    def chat_app(*, key="k", fail_on=None):
        spans: list = []
        pulse = AgentPulse(endpoint="http://unused", capture_inputs=True, capture_outputs=True)
        pulse._transport.enqueue = spans.append
        config = ChatConfig(
            provider="nvidia",
            models={a: f"fixture-{a}" for a in AGENTS},
            api_key=key,
            key_env="NVIDIA_API_KEY",
        )
        return TestClient(create_app(config, llm_client=FakeModel(fail_on), pulse=pulse)), spans

    ok_chat, ok_spans = chat_app()
    record("chat_corpus", ok_chat.get("/corpus"))
    record("chat_health", ok_chat.get("/health"))
    ok = record("chat_200", ok_chat.post("/chat", json={"message": "What is agent drift?", "session_id": "sess_fixture"}))
    record("chat_422", ok_chat.post("/chat", json={"message": ""}))

    bad_chat, bad_spans = chat_app(fail_on="fixture-verifier")
    failed = record("chat_502", bad_chat.post("/chat", json={"message": "What is agent drift?", "session_id": "sess_fixture"}))

    no_key_chat, _ = chat_app(key=None)
    record("chat_503", no_key_chat.post("/chat", json={"message": "What is agent drift?"}))

    ok_trace = ok["body"]["trace_id"]
    failed_trace = failed["body"]["trace_id"]

    # ── the AgentPulse API ───────────────────────────────────────────────────

    from sqlmodel import Session, create_engine, select

    from app.config import settings
    from app.main import app
    from app.models import AgentRecord, Alert, DriftRecord, Evaluation, Span, WorkerHeartbeat
    from app.services.alerting import AlertEngine

    def ingest(client, spans):
        payload = IngestRequest(spans=spans, service_name="rag_chat").model_dump(mode="json")
        resp = client.post("/v1/ingest", json=payload, headers=AUTH)
        assert resp.status_code == 202, resp.text
        return resp

    with TestClient(app) as api:
        record("health_ready", api.get("/v1/health/ready"))
        # No heartbeat yet: the 503 body is what an operator sees with the worker down.
        record("health_evaluator_none", api.get("/v1/health/evaluator"))
        record("trace_not_found", api.get("/v1/traces/does-not-exist"))

        # A live WebSocket sees the broadcast an ingest produces.
        with api.websocket_connect("/v1/ws/live") as ws:
            ingest(api, ok_spans)
            pushed = json.loads(ws.receive_text())
        (out / "ws_new_span.json").write_text(
            json.dumps({"method": "WS", "path": "/v1/ws/live", "status": 101, "body": pushed}, indent=2) + "\n",
            encoding="utf-8",
        )
        recorded.append("ws_new_span")
        ingest(api, bad_spans)

        record("trace_pending", api.get(f"/v1/traces/{ok_trace}"))

        # ── what the worker would have written ───────────────────────────────
        engine = create_engine(f"sqlite:///{db.as_posix()}")
        alerts = AlertEngine(
            hallucination_threshold=settings.hallucination_threshold,
            drift_threshold=settings.drift_threshold,
            asi_low_threshold=settings.asi_low_threshold,
        )
        with Session(engine) as s:
            by_trace = {
                t: {sp.agent_id: sp for sp in s.exec(select(Span).where(Span.trace_id == t)).all()}
                for t in (ok_trace, failed_trace)
            }
            ok_by_agent, failed_by_agent = by_trace[ok_trace], by_trace[failed_trace]

            def evaluation(span, **values):
                s.add(Evaluation(span_id=span.span_id, trace_id=span.trace_id, **values))

            evaluation(ok_by_agent["retriever"], grounding_score=0.08, tool_claim_score=0.0, tool_claims_found=1,
                       overall_risk_score=0.08, label="low_risk", evaluation_stage="stage1")
            evaluation(ok_by_agent["verifier"], grounding_score=0.12, overall_risk_score=0.12,
                       label="low_risk", evaluation_stage="stage1")
            evaluation(ok_by_agent["answerer"], grounding_score=0.81, overall_risk_score=0.81,
                       label="high_risk", evaluation_stage="stage2")
            evaluation(failed_by_agent["retriever"], grounding_score=0.1, tool_claim_score=0.0, tool_claims_found=1,
                       overall_risk_score=0.1, label="low_risk", evaluation_stage="stage1")
            # The failed span has no output to check; the runner records "skipped".
            evaluation(failed_by_agent["verifier"], evaluation_stage="skipped")

            answerer = ok_by_agent["answerer"]
            pending = alerts.evaluate(
                trace_id=ok_trace, span_id=answerer.span_id, agent_id="answerer",
                risk_score=0.81, grounding_score=0.81,
            ) + alerts.evaluate(
                agent_id="retriever", window_centroid_distance=0.34, stability_index=42.0,
            )
            for a in pending:
                s.add(Alert(trace_id=a.trace_id, span_id=a.span_id, agent_id=a.agent_id, alert_type=a.alert_type,
                            severity=a.severity, message=a.message, details_json=json.dumps(a.details)))

            # retriever: warmed up and drifting. verifier: exactly at the 32-span
            # gate. answerer: still warming up, so no windowed distance yet.
            for agent_id, size, centroid, window, tool, asi in (
                ("retriever", 41, 0.27, 0.34, 0.05, 42.0),
                ("verifier", 32, 0.15, 0.11, 0.0, 88.4),
                ("answerer", 14, 0.18, None, None, None),
            ):
                s.add(DriftRecord(agent_id=agent_id, centroid_distance=centroid, window_centroid_distance=window,
                                  tool_drift=tool, stability_index=asi, baseline_size=size))
                agent_row = s.get(AgentRecord, agent_id)
                agent_row.current_asi = asi
                s.add(agent_row)

            s.add(WorkerHeartbeat(worker_id="fixture-worker-1", hostname="fixture-host", pid=1, status="running",
                                  jobs_processed=5, nli_backend="onnx", embedding_backend="onnx"))
            s.commit()

        record("trace_evaluated", api.get(f"/v1/traces/{ok_trace}"))
        record("trace_failed", api.get(f"/v1/traces/{failed_trace}"))
        record("health_evaluator_alive", api.get("/v1/health/evaluator"))
        record("drift", api.get("/v1/drift"))
        listed = record("alerts", api.get("/v1/alerts"))

        # The frontend used to acknowledge with {"status": "acknowledged"}.
        target = next(a["id"] for a in listed["body"]["alerts"] if a["severity"] == "HIGH")
        record("alert_patch_legacy_body", api.patch(f"/v1/alerts/{target}", json={"status": "acknowledged"}, headers=AUTH))
        record("alerts_after_legacy_patch", api.get("/v1/alerts"))
        record("alert_patch", api.patch(f"/v1/alerts/{target}", json={"acknowledged": True}, headers=AUTH))
        record("alerts_after_ack", api.get("/v1/alerts"))
        record("alert_patch_not_found", api.patch("/v1/alerts/999999", json={"acknowledged": True}, headers=AUTH))

    commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True).stdout.strip()
    meta = {
        "agentpulse_commit": commit,
        "captured_on": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "regenerate": "scripts/capture_backend_fixtures.py --agentpulse <checkout>",
        "stubbed": [
            "the language model behind the chat service (recording fake; reply text is invented)",
            "the evaluation worker (Evaluation, DriftRecord, WorkerHeartbeat rows inserted directly; their numbers are invented)",
        ],
        "files": sorted(recorded),
    }
    (out / "_meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(recorded)} fixtures to {out}")
    shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
