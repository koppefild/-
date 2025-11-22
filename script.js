let schedule = [];
let currentTab = 'month';
const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLWuDQAAA...'); // короткий бип (упрощённо)


if ('Notification' in window) {
  document.getElementById('notifyBtn').style.display = 'block';
}
document.getElementById('notifyBtn').addEventListener('click', () => {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(perm => {
      document.getElementById('notifyStatus').textContent =
        perm === 'granted' ? 'Уведомления разрешены' : 'Уведомления запрещены';
    });
  }
});

const img = new Image();
img.src = URL.createObjectURL(file);
await img.decode();


const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = img.width;
canvas.height = img.height;
ctx.filter = 'contrast(150%) brightness(110%)';
ctx.drawImage(img, 0, 0);


const correctedBlob = await new Promise(resolve =>
  canvas.toBlob(resolve, 'image/jpeg', 0.95)
);


document.getElementById('imageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('rus');
    await worker.initialize('rus');
    const { data } = await worker.recognize(file);
    await worker.terminate();

    schedule = parseSchedule(data.text);
    saveToStorage();
    renderCurrentView();
    startNotifications();
  } catch (err) {
    document.getElementById('result').innerHTML = `<p style="color:red">Ошибка: ${err.message}</p>`;
  }
});


function parseSchedule(text) {
  return text.split('\n')
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length >= 6)
    .map(parts => ({
      date: parts[0],
      fajr: parts[1],
      zuhr: parts[2],
      asr: parts[3],
      maghrib: parts[4],
      isha: parts[5]
    }));
}


function saveToStorage() {
  localStorage.setItem('namazSchedule', JSON.stringify(schedule));
}
function loadFromStorage() {
  const saved = localStorage.getItem('namazSchedule');
  if (saved) schedule = JSON.parse(saved);
}


document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;
    btn.classList.add('active');
    document.querySelector('.tab-btn.active')?.classList.remove('active');
    renderCurrentView();
  });
});


function renderCurrentView() {
  loadFromStorage(); 
  if (currentTab === 'month') {
