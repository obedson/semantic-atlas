"use client";

import { AlertCircle, LogOut, PlugZap, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  connectWallet,
  getConnectedWallet,
  watchWalletConnection,
  watchDiscoveredProviders,
  getLegacyProvider,
  getActiveProviderName,
  disconnectWallet,
  type WalletConnection,
  type DiscoveredProvider,
} from "@/lib/arkiv";
import { truncateMiddle } from "@/lib/format";

export function WalletButton() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [providers, setProviders] = useState<DiscoveredProvider[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    // Watch wallet connection
    void getConnectedWallet()
      .then((existingConnection) => {
        if (isMounted) {
          setConnection(existingConnection);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConnection(null);
        }
      });

    let unwatch: (() => void) | undefined;
    try {
      unwatch = watchWalletConnection((nextConnection) => {
        if (isMounted) {
          setConnection(nextConnection);
          setError(null);
        }
      });
    } catch {
      unwatch = undefined;
    }

    // Watch discovered wallet providers
    const unwatchProviders = watchDiscoveredProviders((nextProviders) => {
      if (isMounted) {
        setProviders(nextProviders);
      }
    });

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      isMounted = false;
      unwatch?.();
      unwatchProviders();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleConnect(providerUuid: string) {
    setIsConnecting(true);
    setError(null);
    setShowDropdown(false);

    try {
      const nextConnection = await connectWallet(providerUuid);
      setConnection(nextConnection);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnect() {
    disconnectWallet();
    setConnection(null);
    setShowDropdown(false);
    setError(null);
  }

  const legacy = getLegacyProvider();
  const allProviders = [...providers];
  if (legacy && !providers.some((p) => p.rdns === legacy.rdns || p.name === legacy.name)) {
    allProviders.push(legacy);
  }

  const activeName = getActiveProviderName() || "Wallet";

  return (
    <div className="relative flex flex-col items-end gap-1" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-900 bg-slate-950 px-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
      >
        {connection ? (
          <ShieldCheck className="h-4 w-4 text-[#80ed99]" aria-hidden />
        ) : isConnecting ? (
          <PlugZap className="h-4 w-4 animate-pulse text-[#ffd166]" aria-hidden />
        ) : (
          <Wallet className="h-4 w-4" aria-hidden />
        )}
        {connection
          ? `${activeName}: ${truncateMiddle(connection.address, 4, 3)}`
          : isConnecting
            ? "Connecting"
            : "Connect wallet"}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
          {connection ? (
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Wallet</p>
                <p className="text-sm font-black text-slate-800 break-all mt-1">{connection.address}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Network: Arkiv Braga ({connection.chainId})</p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 hover:bg-red-100 px-3 py-2 text-sm font-bold text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select a wallet</p>
              {allProviders.length === 0 ? (
                <div className="flex gap-2.5 rounded-lg border border-[#ffd166] bg-[#fffdf0] p-3 text-xs text-[#8a6d00]">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#f5a623]" />
                  <p className="leading-normal">
                    No browser wallets detected. Please install **MetaMask**, **Rabby**, or another EIP-1193 extension.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {allProviders.map((prov) => (
                    <button
                      key={prov.uuid}
                      type="button"
                      onClick={() => handleConnect(prov.uuid)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 p-2.5 text-left text-sm font-bold text-slate-700 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prov.icon}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded object-contain"
                      />
                      <span>{prov.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error ? (
        <p className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-[#ff6b6b] bg-white px-3 py-2 text-right text-xs font-semibold text-[#9d0208] shadow-[0_14px_35px_rgba(15,23,42,0.16)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
