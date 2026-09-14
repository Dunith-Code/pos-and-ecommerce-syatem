import "dotenv/config";
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import paymentsRouter from "./routes/payments";
import { startExpiryJob } from "core/dist/jobs/expireReservations";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);

// global error handler
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
    console.log(`Section 01 backend listening on port ${PORT}`);
    startExpiryJob();
});