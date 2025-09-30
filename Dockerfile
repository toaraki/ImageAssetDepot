# ベースイメージとして軽量なNode.jsイメージを使用
FROM registry.access.redhat.com/ubi8/nodejs-20

# コンテナ内の作業ディレクトリを設定
WORKDIR /usr/src/app

# ICUライブラリをインストール
USER root
RUN yum -y update && yum -y install libicu
USER 1001

# package.json と package-lock.json をコピーして依存関係をインストール
# これにより、アプリケーションコードの変更があっても依存関係のレイヤーはキャッシュされる
COPY package*.json ./

# RUN npm install を実行する前に、作業ディレクトリの所有権を非rootユーザーに変更
# UBIイメージのデフォルトユーザーは `1001`
USER root
RUN chown -R 1001:0 /usr/src/app/
RUN mkdir -p /data/public && chown -R 1001:0 /data
USER 1001

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをすべてコピー
COPY . .

# アプリケーションがリッスンするポートを公開
EXPOSE 3000

# アプリケーションを起動
CMD ["node", "server.js"]