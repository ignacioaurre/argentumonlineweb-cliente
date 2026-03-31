import { create } from "zustand";

const useStore = create(set => ({
    account: {},
    accountLoaded: false,
    initsLoaded: false,
    setAccount: account => set({ account, accountLoaded: true }),
    setAccountLoaded: accountLoaded => set({ accountLoaded }),
    setInitsLoaded: initsLoaded => set({ initsLoaded })
}));

export default useStore;
