require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { WebhookClient } = require("dialogflow-fulfillment");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Email Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Saylani Roti Bank Webhook Running");
});

app.post("/webhook", async (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  const sessionPath = req.body.session || "";
  const sessionId = sessionPath.split("/").pop();

  async function hi(agent) {
    agent.add(
      "Saylani Roti Bank is a welfare initiative by Saylani Welfare International Trust that provides free meals to needy and deserving people across Pakistan."
    );

    // Save to Supabase
    await supabase.from("roti_bank_inquiries").insert({
      session_id: sessionId,
      intent: "roti bank",
    });

    try {
      const info = await transporter.sendMail({
        from: '"Saylani Roti Bank" <' + process.env.EMAIL_USER + '>',
        to: process.env.EMAIL_USER,
        subject: "Jazak Allah for contacting Saylani Roti Bank",
        text: "Thank you for your precious time contacting Saylani Roti Bank.",
      });

      console.log("Email sent:", info.messageId);
    } catch (error) {
      console.error("Email error:", error);
    }
  }

  async function sendNotes(agent) {
    const { number, date, email } = agent.parameters;

    agent.add(
      "Thank you! You can donate food, funds, or sponsor meals through Saylani Welfare International Trust. Would you like online or physical donation details?"
    );

    // Save to Supabase
    await supabase.from("roti_bank_inquiries").insert({
      session_id: sessionId,
      intent: "Donation Inquiry",
      phone_number: number || null,
      email: email || null,
      inquiry_date: date || null,
    });
  }

  const intentMap = new Map();
  intentMap.set("roti bank", hi);
  intentMap.set("Donation Inquiry", sendNotes);

  agent.handleRequest(intentMap);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
