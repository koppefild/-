let schedule = [];
let currentTab = 'month';
const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLWuDQAAA...'); // короткий бип (упрощённо)

// Проверка уведомлений
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

// Парсинг текста
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

// Сохранение в localStorage
function saveToStorage() {
  localStorage.setItem('namazSchedule', JSON.stringify(schedule));
}
function loadFromStorage() {
  const saved = localStorage.getItem('namazSchedule');
  if (saved) schedule = JSON.parse(saved);
}

// Переключение вкладок
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;
    btn.classList.add('active');
    document.querySelector('.tab-btn.active')?.classList.remove('active');
    renderCurrentView();
  });
});

// Рендеринг текущего вида
function renderCurrentView() {
  loadFromStorage(); // подгружаем из хранилища
  if (currentTab === 'month') {
