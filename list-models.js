const { GoogleGenerativeAI } = require("@google/generative-ai");

async function list() {
  const url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAddWM28UigloQnbZdYBvOLzQEVQ0JTAFo";
  let res = await fetch(url);
  let data = await res.json();
  let models = data.models || [];
  while(data.nextPageToken) {
    res = await fetch(url + "&pageToken=" + data.nextPageToken);
    data = await res.json();
    models = models.concat(data.models || []);
  }
  console.log(models.map(m => m.name).filter(n => n.includes("flash")).join('\n'));
}
list();
