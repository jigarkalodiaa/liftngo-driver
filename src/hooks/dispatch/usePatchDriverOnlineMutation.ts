"use client";

import { useMutation } from "@tanstack/react-query";
import { patchDriverOnline } from "@/services/dispatchRest";

/** Calls `patchDriverOnline` in `dispatchRest` (global `axios` + QueryProvider interceptors). */
export function usePatchDriverOnlineMutation() {
  return useMutation({
    mutationFn: (isOnline: boolean) => patchDriverOnline(isOnline),
  });
}
