let schedule = [];
let currentTab = 'month';

// Звуковой сигнал
const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAATZ2P//f39/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

// Уведомления
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

// Загрузка изображения
document.getElementById('imageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Предобработка изображения
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.filter = 'contrast(150%) brightness(110%)';
    ctx.drawImage(img, 0, 0);
    const correctedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

    // OCR
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('rus');
    await worker.initialize('rus');
    const { data } = await worker.recognize(correctedBlob);
    await worker.terminate();

    // Парсинг и рендеринг
    schedule = parseSchedule(data.text);
    saveToStorage();
    renderCurrentView();
    startNotifications();
  } catch (err) {
    document.getElementById('result').innerHTML = `<p style="color:red">Ошибка: ${err}</p>`;
  }
});

// Парсинг расписания
function parseSchedule(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const result = [];
  for (const line of lines) {
    const match = line.match(/(\d{1,2}\.\d{1,2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/);
    if (match) {
      result.push({
        date: match[1],
        fajr: match[2],
        zuhr: match[3],
        asr: match[4],
        maghrib: match[5],
        isha: match[6]
      });
    }
  }
  return result;
}

// Сохранение в localStorage
function saveToStorage() {
  localStorage.setItem('namazSchedule', JSON.stringify(schedule));
}
function loadFromStorage() {
  schedule = JSON.parse(localStorage.getItem('namazSchedule')) || [];
}

// Рендеринг
function renderCurrentView() {
  loadFromStorage();
  if (currentTab === 'month') {
    renderMonth();
  } else {
    renderDay();
  }
}
function renderMonth() {
  const html = `
    <table>
      <thead>
        <tr><th>Дата</th><th>Фаджр</th><th>Зухр</th><th>Аср</th><th>Магриб</th><th>Иша</th></tr>
      </thead>
      <tbody>${schedule.map(d => `<tr><td>${d.date}</td><td>${d.fajr}</td><td>${d.zuhr}</td><td>${d.asr}</td><td>${d.maghrib}</td><td>${d.isha}</td></tr>`).join('')}</tbody>
    </table>`;
  document.getElementById('result').innerHTML = html;
}
function renderDay() {
  // ... (реализуйте выбор даты)
}

// Уведомления
function startNotifications() {
  setInterval(() => {
    const now = new Date();
    schedule.forEach(day => {
      const times = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
      times.forEach(time => {
        const prayerTime = new Date(now.getFullYear(), now.getMonth(), parseInt(day.date.split('.')[0]), ...day[time].split(':').map(Number));
        if (prayerTime.getTime() === now.getTime()) {
          Notification.requestPermission().then(() => {
            new Notification('Намаз', { body: `Время намаза "${time}"` });
            audio.play();
          });
        }
      });
    });
  }, 60000);
}

// Переключение вкладок
document.querySelectorAll('.tab-btn').forEach(btn => 
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;
    renderCurrentView();
  })
);
