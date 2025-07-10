import type {FC, PropsWithChildren} from "react";
import { useRef, useMemo, useEffect } from "react";
import type { ViewProps, LayoutChangeEvent, ImageProps } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useScrollViewOffset, useSharedValue } from "react-native-reanimated";
import {Image, StyleSheet, View} from "react-native";
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
  | { opacity: [number, number] }

type CombinedProps = {imageProps: Omit<ImageProps, 'source'>} & CommonParallaxProps & ViewProps & Pick<ImageProps, 'source'>;

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative'
    },
    internal: {
        position: 'absolute',
        inset: 0
    },
    image: {
        width: '100%',
        height: '100%'
    }
})

const ParallaxBanner: FC<PropsWithChildren<CombinedProps & oneOfSpeedAndTransform & ViewProps>> = (props) => {
    const { children, style , speed, transform, targetElement, source, imageProps, ...rest } = props;
    const controller = useParallaxController();
    const localRef = useRef<View>(null);
    const { style: imageStyle, ...imageRest } = imageProps;
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
            e
            tryUpdateLayout()
        }
    
    const expansionStyle = useMemo(() => {
        const style = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }
        if (!transform) return ({
            top: -Math.abs(speed!) * 10,
            bottom: -Math.abs(speed!) * 10,
            left: 0,
            right: 0
        });
        for(let i=0;i<transform.length;i++) {
            const [typeName, values] = Object.entries(transform[i] as TransformPair)[0] as [string, any];
            if (typeName === 'translateY') {
                style.top = -Math.abs(values[1]),
                style.bottom = -Math.abs(values[0])
            } else if (typeName === 'translateX') {
                style.left = -Math.abs(values[1]),
                style.right = -Math.abs(values[0])
            } else if (typeName === 'matrix') {
                if (values[0].length === 6) {
                    style.right = -Math.abs(values[0][4]);
                    style.bottom = -Math.abs(values[0][5]);
                } else if (values[0].length === 9) {
                    style.right = -Math.abs(values[0][7]);
                    style.bottom = -Math.abs(values[0][8]);
                }
                else if (values[1].length === 9) {
                    style.left = -Math.abs(values[1][4]);
                    style.top = -Math.abs(values[1][5]);
                } else if (values[0].length === 9) {
                    style.left = -Math.abs(values[1][7]);
                    style.top = -Math.abs(values[1][8]);
                }
            }
        }
        return style;
    }, [transform, speed])

    //@ts-ignore
    const parallaxStyleFromTransform = (progress: number) => {
            "worklet";
            let arr = [];
            let others = {};
            for(let i=0;i<transform!.length;i++) {
                const t = transform![i] as TransformPair;
                const typeName = Object.keys(t as TransformPair)[0] as keyof TransformPair
                //@ts-ignore
                if (typeName === 'opacity') others.opacity = 1 - progress;
                else arr.push({[typeName]: augmentedInterpolate(
                        progress,
                        [
                            0,
                            1
                        ],
                        [t[typeName][0], t[typeName][1]]
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
        if (controller.containerAxisVertical) return {
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
        }; else return {
            transform: [
                {
                translateX: interpolate(
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
         <View style={[styles.container, style]} ref={localRef} onLayout={handleLayout} {...rest}>
            {/*@ts-ignore*/}
            <Animated.View style={[styles.internal, expansionStyle, parallaxStyle]}  >
                <Image {...imageRest} source={source} style={[styles.image, imageStyle]} />
            </Animated.View>
            {children}
        </View>
)}


export default ParallaxBanner;