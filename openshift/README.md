# OpenShiftへのデプロイ手順

このガイドは、`ImageAssetDepot`アプリケーションをOpenShiftクラスターにデプロイするための手順を説明します。

---

## 前提条件

-   OpenShift クラスターへのアクセス権限
-   `oc` CLI ツールがローカルにインストールされ、クラスターにログイン済みであること
-   アプリケーションコードが Git リポジトリにプッシュ済みであること

---

## ステップ 1: ビルド設定の適用

`imagedepot-build.yaml`を適用して、OpenShiftにビルド設定を登録します。このファイルは、Gitリポジトリからコンテナイメージを自動的にビルドするための設定を含んでいます。

```bash
oc apply -f openshift/imagedepot-build.yaml
```

**備考**: `nodejs:20-ubi8`イメージストリームがプロジェクトに存在しない場合、以下のコマンドで手動でインポートしてください。

```bash
oc import-image nodejs:20-ubi8 --from=[registry.access.redhat.com/ubi8/nodejs-20](https://registry.access.redhat.com/ubi8/nodejs-20) --confirm
```

## ステップ 2: ビルドの開始

ビルド設定を適用した後、初回のビルドを手動で開始します。

```bash
oc start-build image-asset-depot-build --from-dir=.
```

ビルドの進捗は以下のコマンドで確認できます。

```bash
oc logs -f bc/image-asset-depot-build
```

ビルドが完了すると、`image-asset-depot:latest`という新しいイメージがImageStreamにプッシュされます。

## ステップ 3: デプロイ設定の適用

ビルドが成功したら、`imagedepot-deploy.yaml`を適用してアプリケーションをデプロイします。このファイルは、アプリケーションの実行に必要な`Deployment`、`Service`、`Route`、`PVC`を定義しています。

```bash
oc apply -f openshift/imagedepot-deploy.yaml
```

## ステップ 4: デプロイ後の確認

デプロイが完了すると、以下のコマンドでアプリケーションに割り当てられたURLを確認できます。

```bash
oc get route image-asset-depot
```

ブラウザでこのURLにアクセスすると、HTTPS経由でアプリケーションにアクセスできます。`Route`リソースは自動的にSSLを終端し、HTTPリクエストをHTTPSにリダイレクトします。

