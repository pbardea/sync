"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";

import { useContext } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home } from "@/models/home";
import { observer } from "mobx-react";
import { PoolContext } from "@/main";
import { User } from "./models/user";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const FormSchema = z.object({
    user_id: z.string({
        required_error: "Please select an user to display.",
    }),
});

export const Trips = observer(() => {
    const pool = useContext(PoolContext);
    const home = pool.getRoot as Home;
    const trip = home.members.find((x) => x.trips.length > 0)!.trips.get(0);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        const member = trip.members.items.find((m: User) => m.id === data.user_id);
        if (member === undefined) {
            const userToAdd = home.members.find((m: User) => m.id === data.user_id)!;
            trip.members.push(userToAdd);
        } else {
            if (trip.members.length === 1) {
                return;
            }
            trip.members.delete(member);
        }
        trip.save();
    }

    return (
        <>
            <h1>{trip.name}</h1>
            <h2>{trip.members?.items.map((m: User) => m.name)}</h2>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-2/3 space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="user_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a verified email to display" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {home.members.map((m: User) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Toggle</Button>
                </form>
            </Form>
        </>
    );
});
