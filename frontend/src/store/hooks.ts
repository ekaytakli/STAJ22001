/**
 * ÖZEL TİP KORUMALI REDUX KANCALARI (CUSTOM HOOKS)
 *
 * Bu dosya, React bileşenlerinin Redux veri deposuyla (Store) güvenli iletişim kurmasını sağlar.
 * - 'useAppDispatch': Depoya görev silme, oturum açma gibi emirleri (action) göndermek için kullanılır.
 * - 'useAppSelector': Depodaki kullanıcı adı veya görev listesi gibi verileri okumak için kullanılır.
 * TypeScript desteği sayesinde kod yazarken otomatik tamamlama ve tip güvenliği sunar.
 */

import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";

// Klasik useDispatch yerine bunu kullanıyoruz; böylece gönderdiğimiz Redux eylemleri tipleriyle tam uyumlu çalışıyor.
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Klasik useSelector yerine bunu kullanıyoruz; state.auth veya state.todos yazarken otomatik tamamlama ve tip güvenliği sağlıyor.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;