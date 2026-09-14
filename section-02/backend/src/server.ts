import "dotenv/config";
import express from "express";
import cors from "cors";
import catalogRouter from "./routes/catalog";
import orderRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import { startExpiryJob } from "core/dist/jobs/expireReservations";

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res,) => {
    res.json({ status: "ok" });
});

app.use("/api/catalog", catalogRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentsRouter);

app.use(
    (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        console.error(err);
        const status = (err as any).status || 500;
        res.status(status).json({ error: err.message || "Internal server error" });
    }
);

app.listen(PORT, () => {
    console.log(`Section 02 backend listening on port ${PORT}`);
    startExpiryJob();
});
