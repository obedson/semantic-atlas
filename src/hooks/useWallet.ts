"use client";

import { useEffect, useState } from "react";
import {
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  watchWalletConnection,
  watchDiscoveredProviders,
  getLegacyProvider,
  getActiveProviderName,
  setActiveProviderUuid,
  type WalletConnection,
  type DiscoveredProvider,
} from "@/lib/arkiv";

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [providers, setProviders] = useState<DiscoveredProvider[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeWallet = watchWalletConnection(setConnection);
    const unsubscribeProviders = watchDiscoveredProviders(setProviders);

    return () => {
      unsubscribeWallet();
      unsubscribeProviders();
    };
  }, []);

  const connect = async (providerUuid?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      if (providerUuid) {
        setActiveProviderUuid(providerUuid);
      }
      const conn = await connectWallet();
      setConnection(conn);
      return conn;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    disconnectWallet();
    setConnection(null);
    setError(null);
  };

  const refresh = async () => {
    try {
      const conn = await getConnectedWallet();
      setConnection(conn);
    } catch {
      setConnection(null);
    }
  };

  return {
    connection,
    providers,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh,
    providerName: getActiveProviderName(),
    legacyProvider: getLegacyProvider(),
  };
}
