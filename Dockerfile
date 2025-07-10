# Node.js'in 20. versiyonunu temel alarak başlıyoruz.
FROM node:20

# Konteynerin içinde uygulamamızın yaşayacağı bir klasör oluşturuyoruz.
WORKDIR /usr/src/app

# Önce package.json ve package-lock.json dosyalarını kopyalıyoruz.
# Bu, her kod değişikliğinde tüm paketlerin yeniden indirilmesini engeller.
COPY package*.json ./

# Bağımlılıkları (express, mongoose vb.) yüklüyoruz.
RUN npm install

# Projemizin geri kalan tüm dosyalarını konteynerin içine kopyalıyoruz.
COPY . .

# Uygulamamızın çalışacağı portu dışarıya açıyoruz.
EXPOSE 5001

# Konteyner çalıştığında otomatik olarak çalışacak olan komut.
CMD [ "node", "app.js" ]