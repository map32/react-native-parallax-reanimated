import React, { createContext, useContext, useRef } from "react";
import { findNodeHandle, type LayoutChangeEvent, type LayoutRectangle } from "react-native";
import Animated, { type SharedValue, interpolate, useSharedValue, Extrapolation, useAnimatedRef, type AnimatedRef } from "react-native-reanimated";

interface Element {
    id: string;
    layout: LayoutRectangle;
}

interface ParallaxControllerContextType {
    handleContainerLayout: (event: LayoutChangeEvent) => void;
    returnProgressValue: (layout: LayoutRectangle, offset: number) => number;
    attachScroll: (node: Animated.ScrollView | null) => void;
    handleTargetLayout: (event: LayoutChangeEvent) => void;
    registerTarget: (ref: React.RefObject<any>) => void;
    registerElementToTarget: (targetRef: React.RefObject<any>, elementRef: React.RefObject<any>, callback: Function) => void;
    unregisterElementToTarget: (targetRef: React.RefObject<any>, elementRef: React.RefObject<any>) => void;
    scrollRef: AnimatedRef<Animated.ScrollView>;
    containerLayout: SharedValue<LayoutRectangle>;
    containerAxisVertical: SharedValue<boolean>;
}

interface TargetCallbackMap {
    targetMap: Map<number, number[]>;
    elementMap: Map<number, Function>
}

const ParallaxControllerContext = createContext<ParallaxControllerContextType | null>(null);

export const ParallaxControllerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const containerLayout = useSharedValue<LayoutRectangle>({ height: 0, width: 0, x: 0, y: 0 });
    const containerAxisVertical = useSharedValue(true);
    const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
    const map = useRef<TargetCallbackMap>({
    targetMap: new Map<number, number[]>(),
    elementMap: new Map<number, Function>()
});

    const registerTarget = (ref: React.RefObject<any>) => {
        const m = map.current.targetMap;
        const id = findNodeHandle(ref?.current);
        if (!m.has(id as number)) m.set(id as number, []);
    }

    const handleTargetLayout = (e: LayoutChangeEvent) => {
        const m = map.current.targetMap;
        const ee = map.current.elementMap;
        //@ts-ignore
        const el = m.get(findNodeHandle(e.nativeEvent.target))
        el?.map((id) => ee.get(id)!())
    }

    const registerElementToTarget = (targetRef: React.RefObject<any>, elementRef: React.RefObject<any>, callback: Function) => {
        const m = map.current.targetMap;
        const id = findNodeHandle(targetRef?.current);
        const elid = findNodeHandle(elementRef?.current) as number;
        if (!m.has(id as number)) m.set(id as number, [elid]);
        else m.set(id as number, [...m.get(id as number)!, elid]);
        map.current.elementMap.set(elid, callback);
    }

    const unregisterElementToTarget = (targetRef: React.RefObject<any>, elementRef: React.RefObject<any>) => {
        const m = map.current.targetMap;
        const id = findNodeHandle(targetRef?.current);
        const elid = findNodeHandle(elementRef?.current) as number;
        if (m.has(id as number)) m.set(id as number, m.get(id as number)!.filter((id) => id !== elid));
    }

    const returnProgressValue = (layout: LayoutRectangle, offset: number) => {
        "worklet";
        if (!containerAxisVertical.value) {
            return interpolate(
                containerLayout.value.x + offset,
                [
                    containerLayout.value.x + layout.x - containerLayout.value.width,
                    containerLayout.value.x + layout.x + layout.width
                ],
                [0, 1],
                Extrapolation.CLAMP
            );
        } else {
            return interpolate(
                containerLayout.value.y + offset,
                [
                    containerLayout.value.y + layout.y - containerLayout.value.height,
                    containerLayout.value.y + layout.y + layout.height
                ],
                [0, 1],
                Extrapolation.CLAMP
            );
        }
    }

    const calculateProgress = (element: Element, offset: number) => {
        "worklet";
        if (!containerAxisVertical.value) {
            return interpolate(
                containerLayout.value.x + offset,
                [
                    containerLayout.value.x + element.layout.x - containerLayout.value.width,
                    containerLayout.value.x + element.layout.x + element.layout.width
                ],
                [0, 1],
                Extrapolation.CLAMP
            );
        } else {
            return interpolate(
                containerLayout.value.y + offset,
                [
                    containerLayout.value.y + element.layout.y - containerLayout.value.height,
                    containerLayout.value.y + element.layout.y + element.layout.height
                ],
                [0, 1],
                Extrapolation.CLAMP
            );
        }
    };

    const handleContainerLayout = (event: LayoutChangeEvent) => {
        containerLayout.value = event.nativeEvent.layout;
    };

    const attachScroll = (node: Animated.ScrollView | null) => {
        if (!node) return;
        //@ts-ignore
        const isHorizontal = node.__internalInstanceHandle.memoizedProps ?? false;
        scrollViewRef(node);
        if (isHorizontal) containerAxisVertical.value = true;
        else containerAxisVertical.value = false;
    }


    return (
        <ParallaxControllerContext.Provider value={{
            handleContainerLayout,
            returnProgressValue,
            attachScroll,
            handleTargetLayout,
            registerTarget,
            registerElementToTarget,
            unregisterElementToTarget,
            scrollRef: scrollViewRef,
            containerLayout,
            containerAxisVertical
            
        }}>
            {children}
        </ParallaxControllerContext.Provider>
    );
};

export const useParallaxController = () => {
    const ctx = useContext(ParallaxControllerContext);
    if (!ctx) throw new Error("useParallaxController must be used within a ParallaxControllerProvider");
    return ctx;
};
