# Node.js'in 20. versiyonunu temel alarak başlıyoruz.
FROM node:20

# === YENİ EKLENEN KISIM ===
# Konteynerin içine, healthcheck için gerekli olan 'curl' programını kuruyoruz.
# 'apt-get update' ile paket listesini günceller, 'apt-get install' ile de kurarız.
RUN apt-get update && apt-get install -y curl

# Konteynerin içinde uygulamamızın yaşayacağı bir klasör oluşturuyoruz.
WORKDIR /usr/src/app

# Önce package.json dosyalarını kopyalıyoruz.
COPY package*.json ./

# Bağımlılıkları yüklüyoruz.
RUN npm install

# Projemizin geri kalan tüm dosyalarını konteynerin içine kopyalıyoruz.
COPY . .

# Uygulamamızın çalışacağı portu dışarıya açıyoruz.
EXPOSE 5001

# Konteyner çalıştığında otomatik olarak çalışacak olan komut.
CMD [ "node", "app.js" ]