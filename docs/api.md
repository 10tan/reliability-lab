# REST & WebSocket API Reference

## Endpoints

### `POST /api/models`
Registers a new joint distribution & limit state configuration.

### `POST /api/runs`
Launches a rare-event reliability simulation (Subset Simulation, Importance Sampling, PCE, Kriging).

### `GET /api/runs/{run_id}`
Retrieves simulation results, $P_f$, $\beta$, CoV, and level diagnostics.

### `POST /api/system`
Evaluates series, parallel, or cut-set system reliability block diagrams.

### `GET /api/reports/{run_id}`
Generates and downloads the provenance PDF report.

### `WS /api/runs/{run_id}/stream`
WebSocket connection for real-time sample convergence updates.
