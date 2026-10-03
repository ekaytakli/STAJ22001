import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "./store";

// Klasik useDispatch yerine bunu kullanıyoruz; böylece gönderdiğimiz Redux eylemleri tipleriyle tam uyumlu çalışıyor.
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Klasik useSelector yerine bunu kullanıyoruz; state.auth veya state.todos yazarken otomatik tamamlama ve tip güvenliği sağlıyor.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;