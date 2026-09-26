"use client";

import { useLanguage } from "@/i18n/LanguageProvider";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Location = {
  latitude: number;
  longitude: number;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
  draggable?: boolean;
  onChange?: (
    location: Location
  ) => void;
  className?: string;
};

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

const MAPBOX_TOKEN =
  process.env
    .NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  "";

const MAPBOX_GL_VERSION =
  "3.30.0";

let loaderPromise:
  Promise<any> | null =
  null;

function loadMapbox() {
  if (
    typeof window ===
    "undefined"
  ) {
    return Promise.reject(
      new Error(
        "Mapbox indisponível no servidor."
      )
    );
  }

  if (window.mapboxgl) {
    return Promise.resolve(
      window.mapboxgl
    );
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise =
    new Promise(
      (
        resolve,
        reject
      ) => {
        const cssId =
          "pizzasystem-mapbox-css";

        if (
          !document.getElementById(
            cssId
          )
        ) {
          const link =
            document.createElement(
              "link"
            );

          link.id =
            cssId;
          link.rel =
            "stylesheet";
          link.href =
            `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css`;

          document.head.appendChild(
            link
          );
        }

        const scriptId =
          "pizzasystem-mapbox-js";

        const existing =
          document.getElementById(
            scriptId
          ) as
            | HTMLScriptElement
            | null;

        if (existing) {
          existing.addEventListener(
            "load",
            () =>
              resolve(
                window.mapboxgl
              ),
            {
              once:
                true,
            }
          );

          existing.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  "Não foi possível carregar o mapa."
                )
              ),
            {
              once:
                true,
            }
          );

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.id =
          scriptId;
        script.async =
          true;
        script.src =
          `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.js`;

        script.onload =
          () =>
            resolve(
              window.mapboxgl
            );

        script.onerror =
          () =>
            reject(
              new Error(
                "Não foi possível carregar o mapa."
              )
            );

        document.head.appendChild(
          script
        );
      }
    );

  return loaderPromise;
}

export default function MapboxLocationPicker({
  latitude,
  longitude,
  draggable =
    false,
  onChange,
  className =
    "",
}: Props) {
  const {
    text,
  } =
    useLanguage();

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<any>(
      null
    );

  const markerRef =
    useRef<any>(
      null
    );

  const onChangeRef =
    useRef(
      onChange
    );

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    onChangeRef.current =
      onChange;
  }, [
    onChange,
  ]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current =
          null;
        markerRef.current =
          null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      !MAPBOX_TOKEN ||
      latitude == null ||
      longitude == null ||
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      ) ||
      !containerRef.current
    ) {
      return;
    }

    let cancelled =
      false;

    void loadMapbox()
      .then(
        (
          mapboxgl
        ) => {
          if (
            cancelled ||
            !containerRef.current ||
            !mapboxgl
          ) {
            return;
          }

          setError(
            ""
          );

          mapboxgl.accessToken =
            MAPBOX_TOKEN;

          if (
            !mapRef.current
          ) {
            const map =
              new mapboxgl.Map(
                {
                  container:
                    containerRef.current,
                  style:
                    "mapbox://styles/mapbox/standard",
                  center: [
                    longitude,
                    latitude,
                  ],
                  zoom:
                    16,
                }
              );

            map.addControl(
              new mapboxgl.NavigationControl(
                {
                  showCompass:
                    false,
                }
              ),
              "top-right"
            );

            map.on(
              "load",
              () => {
                map.resize();
              }
            );

            window.requestAnimationFrame(
              () => {
                map.resize();
              }
            );

            const marker =
              new mapboxgl.Marker(
                {
                  draggable,
                }
              )
                .setLngLat(
                  [
                    longitude,
                    latitude,
                  ]
                )
                .addTo(
                  map
                );

            if (
              draggable
            ) {
              marker.on(
                "dragend",
                () => {
                  const point =
                    marker.getLngLat();

                  onChangeRef.current?.(
                    {
                      latitude:
                        point.lat,
                      longitude:
                        point.lng,
                    }
                  );
                }
              );
            }

            mapRef.current =
              map;

            markerRef.current =
              marker;

            return;
          }

          markerRef.current?.setLngLat(
            [
              longitude,
              latitude,
            ]
          );

          window.requestAnimationFrame(
            () => {
              mapRef.current?.resize();
            }
          );

          mapRef.current.easeTo(
            {
              center: [
                longitude,
                latitude,
              ],
              duration:
                350,
            }
          );
        }
      )
      .catch(
        (
          caught
        ) => {
          if (
            !cancelled
          ) {
            setError(
              caught instanceof
                Error
                ? caught.message
                : text("Não foi possível carregar o mapa.", "We could not load the map.")
            );
          }
        }
      );

    return () => {
      cancelled =
        true;
    };
  }, [
    latitude,
    longitude,
    draggable,
  ]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 ${className}`}
      >
        Configure{" "}
        <strong>
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        </strong>{" "}
        {text(
          " na Vercel para exibir o mapa.",
          " in Vercel to display the map."
        )}
      </div>
    );
  }

  if (
    latitude == null ||
    longitude == null
  ) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground ${className}`}
      >
        {text(
          "Informe o endereço para posicionar o mapa.",
          "Enter the address to position the map."
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-background ${className}`}
    >
      <div
        ref={
          containerRef
        }
        className="h-[260px] w-full"
      />

      {error && (
        <p className="border-t border-border p-3 text-xs font-medium text-primary">
          {error}
        </p>
      )}

      {draggable && (
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {text(
            "Arraste o marcador para ajustar exatamente a saída da pizzaria.",
            "Drag the marker to set the exact store location."
          )}
        </p>
      )}
    </div>
  );
}
