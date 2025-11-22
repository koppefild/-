let schedule = [];
let currentTab = 'month';

// Звуковой сигнал для уведомлений
const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAATZ2P//f39/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

// Проверка поддержки уведомлений
if ('Notification' in window) {
  document.getElementById('notifyBtn').style.display = 'block';
}

// Разрешение уведомлений
document.getElementById('notifyBtn').addEventListener('click', () => {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(perm => {
      document.getElementById('notifyStatus').textContent =
        perm === 'granted' ? 'Уведомления разрешены' : 'Уведомления запрещены';
    });
  }
});

// Загрузка и обработка изображения
document.getElementById('imageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 1. Создаём Image из файла
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    // 2. Создаём canvas для коррекции
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    // Применяем фильтры: повышаем контраст и яркость
    ctx.filter = 'contrast(150%) brightness(110%)';
    ctx.drawImage(img, 0, 0);

    // 3. Конвертируем canvas в Blob (JPEG, качество 95%)
    const correctedBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.95);
    });

    // 4. Инициализируем OCR-worker и распознаём исправленное изображение
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('rus');
    await worker.initialize('rus');

    const { data } = await worker.recognize(correctedBlob);
    await worker.terminate();

    // 5. Парсим результат
    schedule = parseSchedule(data.text);
    saveToStorage();
    renderCurrentView();
    startNotifications();

  } catch (err) {
    document.getElementById('result').innerHTML =
      `<p style="color:red">Ошибка: ${err.message}</p>`;
  }
});

// Парсинг текста в структурированные данные
function parseSchedule(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const result = [];

  for (const line of lines) {
    const match = line.match(/(\d{1,2}\.\d{1,2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\