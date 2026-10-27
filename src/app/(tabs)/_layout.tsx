import { Tabs } from "expo-router";
import { TabIcon } from "@/components/TabIcon";

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#B8860B",
            tabBarInactiveTintColor: "#9A9489",
            tabBarStyle: { backgroundColor: "#F8F7F4", borderTopColor: "#EAE7E1" },
        }}>
            <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />, }} />
            <Tabs.Screen name="topics" options={{ title: "Topics", tabBarIcon: ({ color, size }) => <TabIcon name="book" color={color} size={size} />, }} />
            <Tabs.Screen name="review" options={{ title: "Review", tabBarIcon: ({ color, size }) => <TabIcon name="flash" color={color} size={size} />, }} />
            <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: ({ color, size }) => <TabIcon name="stats-chart" color={color} size={size} />, }} />
        </Tabs>
    );
}