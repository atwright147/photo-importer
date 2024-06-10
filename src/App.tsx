import { useEffect, useMemo, useState } from "react";
import Select from 'react-select';

import {
  AllSystemInfo,
  allSysInfo,
} from "tauri-plugin-system-info-api";
import type {
  Disk,
} from "tauri-plugin-system-info-api";

import "./App.css";

function App() {
  const [disk, setDisk] = useState("");
  const [removableDisks, setRemovableDisks] = useState<Disk[]>([]);

  const options = useMemo(() => removableDisks.map((disk) => ({ value: disk.device, label: disk.device })), [removableDisks]);

  useEffect(() => {
    (async () => {
      const disks = await getRemovableDisks();
      const removableDisks = disks.filter((disk) => disk.is_removable);
      setRemovableDisks(removableDisks);
    })();
  }, []);

  const getRemovableDisks = async (): Promise<Disk[]> => {
    try {
      return AllSystemInfo.parse(await allSysInfo()).disks;
    } catch (err) {
      console.info(err);
      return Promise.reject([]);
    }
  }

  const handleFocus = async () => {
    const disks = await getRemovableDisks();
    setRemovableDisks(disks.filter((disk) => disk.is_removable));
  };

  return (
    <div className="container">
      <h1>Photo Importer</h1>

      <button type="button" onClick={async () => await getRemovableDisks()}>Get Disks</button>

      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Select
          name="disks"
          id="disks"
          onFocus={() => {
            handleFocus();
          }}
          // onChange={(event) => setDisk(event.currentTarget.value)}
          options={options}
        />
      </form>

      <pre>
        {JSON.stringify({ disk, removableDisks }, null, 2)}
      </pre>
    </div>
  );
}

export default App;
