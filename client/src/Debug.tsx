import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Team } from "./models/test_app/team";
import { User } from "./models/test_app/user";
import { computed } from "mobx";
import { Button } from "@/components/ui/button";
import { Input } from "./components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const debounce = (callback: Function, wait: number) => {
  let timeoutId: number | undefined = undefined;
  return (...args: unknown[]) => {
    console.log("Clearing timeout " + timeoutId);
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      console.log("Actually calling save");
      callback(...args);
    }, wait);
    console.log("Timeout ID: " + timeoutId);
  };
};

const Debug = observer((props: { team: Team }) => {
  const [count, setCount] = useState(0);
  const [selectedField, setSelectedField] = useState("name");
  const handleDropdownChange = (e: ChangeEvent) => {
    setSelectedField((e.target as HTMLSelectElement).value);
  };

  const members: User[] = useMemo(() => {
    return computed(() => {
      const sorted = [...(props.team?.members ?? [])];
      sorted.sort((a, b) => (a.id < b.id ? -1 : 1));
      return sorted;
    });
  }, [props.team.members]).get();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const handleUserChange = (e: ChangeEvent) => {
    setSelectedUserId((e.target as HTMLSelectElement).value);
  };

  const selectedUser: User | undefined = useMemo(() => {
    return computed(() => {
      if (selectedUserId === null) {
        return members[0];
      }
      return members.find((x) => x.id === selectedUserId);
    });
  }, [members, selectedUserId]).get();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((selectedUser: User) => {
      console.log("SAVING");
      selectedUser.save();
    }, 200),
    [],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent) => {
      if (!selectedUser) {
        return;
      }

      // FIXME: This update isn't triggering mobx.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selectedUser as any)[selectedField] = (
        e.target as HTMLInputElement
      ).value;
      debouncedSave(selectedUser);
    },
    [selectedField, selectedUser, debouncedSave],
  );

  const createNewUser = useCallback(() => {
    // This is broken.
    const newUser = new User();
    newUser.email = "new_user@email.com";
    newUser.name = "That works too";
    newUser.team = props.team;
    newUser.save();
  }, [props.team]);

  const deleteLastUser = useCallback(() => {
    if (!selectedUser) {
      return;
    }
    selectedUser.delete();
  }, [selectedUser]);

  return (
    <>
      <h1>{props.team?.name || "No team"}</h1>

      <div>{members.map((x) => x.email).join(", ")}</div>
      <div>{members.map((x) => x.name).join(", ")}</div>
      <div>{members.map((x) => x.id).join(", ")}</div>
      <select onChange={handleUserChange} defaultValue={members[0]?.id}>
        {members.map((x) => (
          <option key={x.id} value={x.id}>
            {x.email}
          </option>
        ))}
      </select>
      <select onChange={handleDropdownChange} defaultValue="name">
        <option value="email">Email</option>
        <option value="name">Name</option>
      </select>

      <div className="card">
        <Button onClick={createNewUser}>Create new user</Button>
        <Button onClick={deleteLastUser}>Delete selected user</Button>
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
        <Input onChange={handleInputChange} />
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
});

export default Debug;
