import "dotenv/config";
import express from "express";
import cors from "cors";
import productsRouter from "./routes/products";
import catalogRouter from "./routes/catalog";
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

// Section 01 — POS Order & Inventory System
app.use("/section-01/api/products", productsRouter);
app.use("/section-01/api/orders", ordersRouter);
app.use("/section-01/api/payments", paymentsRouter);

// Section 02 — E-Commerce Checkout & Payment System
app.use("/section-02/api/catalog", catalogRouter);
app.use("/section-02/api/orders", ordersRouter);
app.use("/section-02/api/payments", paymentsRouter);

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
  console.log(`Combined backend (sections 01 + 02) listening on port ${PORT}`);
  startExpiryJob();
});