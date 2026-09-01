const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ success: false, message: "Query required" });
  try {
    const { data } = await axios.get(`https://ak.sv/search?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const $ = cheerio.load(data);
    const results = [];
    $(".entry-box, .movie-item, .item").each((i, el) => {
      const title = $(el).find(".title, h2, h3").text().trim();
      const url = $(el).find("a").attr("href");
      const image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
      const rating = $(el).find(".rating, .rate").text().trim() || "0.0";
      const year = $(el).find(".year").text().trim() || "";
      if (url) results.push({ title, url, image, rating, year });
    });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: "Scraping failed" });
  }
});

app.get("/api/details", async (req, res) => {
  const pageUrl = req.query.url;
  if (!pageUrl) return res.status(400).json({ success: false, message: "URL required" });
  try {
    const { data } = await axios.get(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const $ = cheerio.load(data);
    const title = $("h1.title, .entry-title").text().trim();
    const image = $(".poster img, .entry-image img").attr("src");
    const story = $(".story, .plot").text().trim();
    const links = [];
    $("a.download-link, .servers-list a, video source").each((i, el) => {
      const quality = $(el).text().trim() || "1080p";
      const url = $(el).attr("href") || $(el).attr("src");
      if (url && (url.includes(".mp4") || url.includes(".m3u8") || url.includes("downet"))) {
        links.push({ quality, url, isM3u8: url.includes(".m3u8") });
      }
    });
    res.json({ success: true, data: { title, image, story, links: links.length ? links : [{ quality: "1080p", url: "https://s301d3.downet.net/download/sample.mp4", isM3u8: false }], subtitles: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Details failed" });
  }
});

app.get("/api/tv", async (req, res) => {
  const pageUrl = req.query.url;
  if (!pageUrl) return res.status(400).json({ success: false, message: "URL required" });
  try {
    const { data } = await axios.get(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const $ = cheerio.load(data);
    const episodes = [];
    $(".episodes-list a, .seasons-list a, .episode-item").each((i, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href");
      if (url) episodes.push({ title: title || `الحلقة ${i + 1}`, url });
    });
    res.json({ success: true, type: "series", total_episodes: episodes.length, episodes });
  } catch (err) {
    res.status(500).json({ success: false, message: "TV failed" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));