import {
  Layers3,
  LocateFixed,
  RefreshCw,
} from 'lucide-react';

import {
  useState,
} from 'react';

import {
  CommandMap,
} from '../components/CommandMap';

import {
  SectionTitle,
} from '../components/SectionTitle';

export function MapPage() {
  const [
    mapVersion,
    setMapVersion,
  ] = useState(0);

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionTitle
          title="Interactive accessibility intelligence"
          subtitle="Live incidents, vehicles, corridor risk and approved route geometry."
          action={
            <div
              className="button-row"
            >
              <button
                className="secondary-button"
                onClick={() =>
                  setMapVersion(
                    (
                      value,
                    ) =>
                      value +
                      1,
                  )
                }
              >
                <RefreshCw
                  size={16}
                />

                Refresh
              </button>

              <button className="secondary-button">
                <Layers3
                  size={16}
                />

                Layers
              </button>
            </div>
          }
        />

        <CommandMap
          key={
            mapVersion
          }
        />
      </section>

      <div className="info-grid">
        <div className="info-card">
          <LocateFixed />

          <strong>
            Dynamic accessibility
          </strong>

          <p>
            Live field incidents influence
            corridor risk and operational
            monitoring.
          </p>
        </div>

        <div className="info-card">
          <Layers3 />

          <strong>
            Operational layers
          </strong>

          <p>
            Vehicles, field incidents and
            approved routes are displayed
            directly from FastAPI.
          </p>
        </div>

        <div className="info-card">
          <RefreshCw />

          <strong>
            Live synchronization
          </strong>

          <p>
            The map refreshes after route
            approval, incident events and
            automatically every 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}