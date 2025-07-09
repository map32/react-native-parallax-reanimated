import type {FC, PropsWithChildren} from "react";
import { useRef, useMemo, useEffect } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { AnimatedScrollViewProps } from "react-native-reanimated";
import Animated, { interpolate, useAnimatedStyle, useScrollViewOffset, useSharedValue } from "react-native-reanimated";
import { View } from "react-native";
import { useParallaxController } from './ParallaxController';
import { augmentedInterpolate } from './interpolate';

interface CommonParallaxProps {
    targetElement?: React.RefObject<any>
}

type oneOfSpeedAndTransform = {speed: number, transform?: TransformPair[]} | {speed?: number, transform: TransformPair[]}

type TransformPair =
  | { matrix: [number[], number[]] }
  | { perspective: [number, number] }
  | { rotate: [string, string] }
  | { rotateX: [string, string] }
  | { rotateY: [string, string] }
  | { rotateZ: [string, string] }
  | { scale: [number, number] }
  | { scaleX: [number, number] }
  | { scaleY: [number, number] }
  | { translateX: [number, number] }
  | { translateY: [number, number] }
  | { skewX: [string, string] }
  | { skewY: [string, string] }
  | { opacity: [number, number] };


const Parallax: FC<PropsWithChildren<CommonParallaxProps & oneOfSpeedAndTransform & AnimatedScrollViewProps>> = (props) => {
    const { children, style, speed, transform, targetElement, onLayout, ...rest } = props;
    const controller = useParallaxController();
    const localRef = useRef<View>(null);
    //this must be relative to the scrollview component
    const currentLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
    const offset = useScrollViewOffset(controller.scrollRef.current !== null ? controller.scrollRef : null);

    useEffect(() => {
        if (!targetElement || !targetElement.current) return;
        if (targetElement.current) {
            controller.registerElementToTarget(targetElement, localRef, _updatetargetlayout);
        }
        return () => {controller.unregisterElementToTarget(targetElement,localRef)}
    }, [targetElement])

    const _updatetargetlayout = () => {
        //@ts-ignore
        targetElement.current?.measureLayout(controller.scrollRef.current, (x, y, width, height) => {
                currentLayout.value = {x, y, width, height};
            })
    }

    const tryUpdateLayout = () => {
        if (!controller.scrollRef.current) return;
        if (!targetElement){
            //@ts-ignore
            localRef.current?.measureLayout(controller.scrollRef.current, (x, y, width, height) => {
                currentLayout.value = {x, y, width, height};
            })
        } else {
            _updatetargetlayout()
        }
    }

    const handleLayout = (e: LayoutChangeEvent) => {
        tryUpdateLayout()
    }

    //@ts-ignore
    const parallaxStyleFromTransform = (progress: number) => {
        "worklet";
        let arr = [];
        let others = {};
        for(let i=0;i<transform!.length;i++) {
            const t = transform![i];
            const typeName = Object.keys(t as TransformPair)[0] as keyof TransformPair
            //@ts-ignore
            if (typeName === 'opacity') others.opacity = 1 - progress;
            else arr.push({[typeName]: augmentedInterpolate(
                    progress,
                    [
                        0,
                        1
                    ],
                    [t![typeName][0], t![typeName][1]]
                )
            })
        }
        return {
            transform: arr,
            ...others
        }
    }

    const parallaxFromSpeed = (progress: number) => {
        "worklet";
        return {
            transform: [
                {
                translateY: interpolate(
                    progress,
                    [
                        0,
                        1
                    ],
                    [-speed! * 10, speed! * 10]
                )
            }]
        };
    };

    const getParallaxStyle = useMemo(() => {if (transform) return parallaxStyleFromTransform;
        else return parallaxFromSpeed;}, [transform])

    //@ts-ignore
    const parallaxStyle = useAnimatedStyle(() => {
        const progress = controller.returnProgressValue(currentLayout.value, offset.value)
        return getParallaxStyle(progress)
    });

    return (
        //@ts-ignore
         <Animated.View className={className} style={[style, parallaxStyle]} ref={localRef} onLayout={handleLayout} {...rest}>
            {children}
        </Animated.View>
)}
export default Parallax;