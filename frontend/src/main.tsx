import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

// Projede kullandığımız Bootstrap CSS kütüphanesi ve genel stilleri yüklüyoruz.
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Sayfa yönlendirmelerini içeren ana uygulamamız.
import App from "./App";

// Tüm uygulamanın ortak veri hafızası olan Redux Store.
import { store } from "./store/store";

// index.html içindeki boş <div id="root"></div> etiketini bulup React'i oraya bağlıyoruz.
createRoot(document.getElementById("root")!).render(
    /*
     * StrictMode: Geliştirme ortamında olası hataları ve bellek sızıntılarını
     * erkenden fark edebilmemiz için kodları arka planda denetleyen React güvenlik modudur.
     */
    <StrictMode>
        {/*
     * Provider: Redux kasamızı (store) tüm projeye dağıtır.
     * Bu sayede Login, Register veya TodoPage gibi herhangi bir alt sayfa
     * kasadaki token veya görev verilerine rahatça ulaşabilir.
     */}
        <Provider store={store}>
            {/* Tüm rotaların ve sayfaların çalıştığı ana bileşen */}
            <App />
        </Provider>
    </StrictMode>,
);