import fs from "node:fs";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;

function getLocalChromePath() {
  const localPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of localPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseRenderedText(innerText = "", dot, url) {
  const lines = innerText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const getValueAfterLabel = (labelPattern) => {
    const idx = lines.findIndex((l) => labelPattern.test(l));
    if (idx === -1) return "";
    const sameLineMatch = lines[idx].match(
      new RegExp(labelPattern.source + "\\s*:?\\s*(.+)$", "i")
    );
    if (sameLineMatch && sameLineMatch[1] && sameLineMatch[1].trim().length > 1) {
      return sameLineMatch[1].trim();
    }
    return lines[idx + 1] || "";
  };

  const legalName =
    getValueAfterLabel(/^Legal Business Name$/i) ||
    getValueAfterLabel(/^Legal Name$/i) ||
    "N/A";

  const businessEmailRaw = getValueAfterLabel(/^Business Email$/i);
  const emailMatchesFromField = businessEmailRaw.match(EMAIL_REGEX) || [];
  const emailMatchesFromPage = innerText.match(EMAIL_REGEX) || [];

  const email = (
    emailMatchesFromField[0] ||
    emailMatchesFromPage.find((e) => !e.toLowerCase().endsWith("@dot.gov")) ||
    ""
  )
    .toLowerCase()
    .trim();

  const phoneRaw = getValueAfterLabel(/^Business Telephone No\.?$/i);
  const phone =
    (phoneRaw.match(PHONE_REGEX) || [])[0] ||
    (innerText.match(PHONE_REGEX) || [])[0] ||
    "N/A";

  const address =
    getValueAfterLabel(/^Principal Place of Business$/i) || "N/A";

  return {
    dot,
    url,
    legalName,
    email,
    phone,
    address,
    status: email ? "Found" : "Email Not Listed",
  };
}

export default async function handler(req, res) {
  let browser = null;
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const rawDots = Array.isArray(body.dots)
      ? body.dots
      : body.dot
      ? [body.dot]
      : [];

    const dots = [
      ...new Set(
        rawDots
          .map((d) => String(d || "").trim())
          .filter((d) => /^\d+$/.test(d))
      ),
    ];

    if (!dots.length) {
      return res
        .status(400)
        .json({ ok: false, error: "Valid DOT numbers are required." });
    }

    const isLinuxProduction = process.platform === "linux";
    const executablePath = isLinuxProduction
      ? await chromium.executablePath()
      : getLocalChromePath();

    browser = await puppeteer.launch({
      args: isLinuxProduction
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: isLinuxProduction ? chromium.headless : "new",
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    const results = [];

    for (const dot of dots) {
      const url = `https://motus.dot.gov/customer/${dot}/account`;
      try {
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        await page
          .waitForFunction(
            () =>
              /Legal Business Name|Business Email|USDOT #/i.test(
                document.body.innerText || ""
              ),
            { timeout: 10000 }
          )
          .catch(() => {});

        const innerText = await page.evaluate(
          () => document.body.innerText || ""
        );

        results.push(parseRenderedText(innerText, dot, url));
      } catch (err) {
        results.push({
          dot,
          url,
          legalName: "N/A",
          email: "",
          phone: "N/A",
          address: "N/A",
          status: `Error: ${err?.message || "Page timeout"}`,
        });
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Browser execution error",
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}