"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Home } from "@/models/home";
import { observer } from "mobx-react";
import { PoolContext } from "@/main";
import { User } from "@/models/user";

export const HomeSettings = observer(() => {
  const pool = useContext(PoolContext);
  const home = pool.getRoot as Home;

  useEffect(() => {
    setName(home.name);
  }, [home.name]);

  const [name, setName] = useState(home.name);
  const [isSaving, setIsSaving] = useState(false);

  const deleteUser = async () => {
    try {
        const user = home.members.find(x => x.email === "new_user@user.com")!;
        user.delete();

      toast({
        title: "Added user",
        description: "Your home name has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        details: error,
        variant: "destructive",
      });
    }
  };

  const addUser = async () => {
    try {
        const newUser = new User();
        newUser.email = "new_user@user.com";
        newUser.name = "New User";
        newUser.home = home;
        newUser.save();

      toast({
        title: "Added user",
        description: "Your home name has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        details: error,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      home.name = name;
      home.save();

      toast({
        title: "Settings saved",
        description: "Your home name has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        details: error,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Home Settings</CardTitle>
        <CardDescription>Manage your home details</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Home Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your home name"
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button onClick={addUser}> Add </Button>
        <Button onClick={deleteUser}> Delete </Button>
      </CardFooter>
      {home.members.map(x => JSON.stringify({id: x.id, name: x.name})).join(", ")}<br />
    </Card>
  );
});
