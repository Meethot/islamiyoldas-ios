// Ücretsiz kullanıcı sınırları — tek kaynak.
//
// Günlük zikir hakkı eskiden 6 ayrı yere (Dhikr.jsx ve Home.jsx'te üçer kez;
// hem kontrol mantığında hem ekranda) sabit sayı olarak gömülüydü. Sayıyı
// değiştirmek için hepsini bulmak gerekiyordu; biri atlanırsa ekranda yazan
// sınır ile gerçekte uygulanan sınır ayrışıyordu. Artık buradan yönetilir.
//
// Not: Zikirmatik (`zikirmatik_daily_limit`) ile ana ekrandaki Esma sayacı
// (`esma_daily_limit`) AYRI sayaçlar tutar; bu sabit her ikisinin de tavanıdır.
export const DAILY_DHIKR_LIMIT = 99;
