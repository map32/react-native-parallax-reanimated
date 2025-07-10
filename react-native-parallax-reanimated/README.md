# react-native-parallax-reanimated

Various scroll-driven parallax effects for React Native with Reanimated. Inspired by parallax-controller and react-scroll-parallax

## Installation

```sh
npm install react-native-parallax-reanimated
```

## Usage

Wrap components with ParallaxControllerProvider first
```js
<ParallaxControllerProvider>
    <App />
</ParallaxControllerProvider>
```
Normal use (animated views inside a Animated.Scrollview)
```js
const {attachScroll, handleContainerLayout} = useParallaxController();
    <Animated.ScrollView ref={attachScroll} onLayout={handleContainerLayout} >
        <Parallax speed={10} style={{width: '100%', height: '60'}}> //View translates in parallax vertically depending on speed
        <Parallax transform={[{rotate: ['0deg','360deg']}, {translateX: [-100, 100]}, {opacity: [1, 0]}]} style={{width: '100%', height: '60'}}> //add custom transforms
        //note speed and transform are mutually exclusive (using both won't cause error but will result in unexpected behavior)
        <ParallaxBanner source={asset} speed={10}>
    </Animated.ScrollView>
// ...

```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
