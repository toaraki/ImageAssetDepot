# ImageAssetDepot

`ImageAssetDepot`は、Node.jsとExpressを使って構築されたシンプルな画像管理・配信サーバーです。コンテナ技術を利用することで、クリーンな開発環境とデータの永続化を実現します。

## 🚀 特徴

* **画像管理**: 管理画面から画像をアップロード、削除、重み付け管理ができます。
* **重み付け配信**: 設定された重みに基づいて、画像をランダムに配信します。
* **コンテナネイティブ**: Red Hat UBIベースのコンテナで動作し、OpenShiftへのデプロイを前提としています。
* **データ永続化**: データベースファイルと画像は専用の永続ボリュームに保存されます。

---

## 💻 開発環境のセットアップ

PodmanまたはDockerがインストールされていれば、VS CodeのDev Containersを使用するか、またはコマンドラインから直接実行するかの2つの方法で環境をセットアップできます。

### 前提条件

-   Podman または Docker
-   Git

### 1. VS Code Dev Containers を使用する場合

VS CodeとDev Containers拡張機能がインストールされていれば、最も簡単な方法です。

1.  **Podmanボリュームの作成**
    アプリケーションのデータを永続化するため、まず名前付きボリュームを作成します。
    ```bash
    podman volume create imagedepot-data
    ```
2.  **Dev Containerの起動**
    VS Codeでこのリポジトリを開くと、自動的に「コンテナで再開」を促されます。これを選択すると、`devcontainer.json`の設定に基づいてコンテナがビルド・起動し、`imagedepot-data`ボリュームが自動的にマウントされます。

    devcontiner.json の記入例
    ```JSON
        "runArgs": [
            "--volume",
            "imagedepot-data:/data"
        ]
    ```

### 2. コマンドラインから直接実行する場合

VS Codeを使用しない開発者向けの手順です。

1.  **Gitリポジトリをクローン**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>
    ```
2.  **Podmanボリュームの作成**
    ```bash
    podman volume create imagedepot-data
    ```
3.  **コンテナイメージのビルド**
    プロジェクトのルートディレクトリで、`Dockerfile`を使ってイメージをビルドします。
    ```bash
    podman build -t image-asset-depot .
    ```
4.  **コンテナの起動**
    ビルドしたイメージを使い、作成したボリュームとポートをマウントしてコンテナを起動します。
    ```bash
    podman run -d --name image-asset-depot -p 3000:3000 -v imagedepot-data:/data image-asset-depot
    ```

---

## ⚙️ 使い方

コンテナが起動したら、`npm start`コマンドは既に`CMD`に設定されているため、直接ブラウザでアクセスできます。

### 管理画面

ブラウザで以下のURLにアクセスすると、画像の管理画面が表示されます。