# @freepina/react-native-parallax-reanimated

Various scroll-driven parallax effects for React Native with Reanimated. Inspired by [parallax-controller](https://www.npmjs.com/package/parallax-controller) and [react-scroll-parallax](https://www.npmjs.com/package/react-scroll-parallax)

Also supports NativeWind if installed on your project
## Installation

```sh
npm install @freepina/react-native-parallax-reanimated
```

## Usage

Wrap components with ParallaxControllerProvider first
```js
import {ParallaxControllerProvider} from '@freepina/react-native-parallax-reanimated'

<ParallaxControllerProvider>
    <App />
</ParallaxControllerProvider>
```
Normal use (animated views inside a Animated.Scrollview)
```js
import {useParallaxController, Parallax, ParallaxBanner} from '@freepina/react-native-parallax-reanimated'

const {attachScroll, handleContainerLayout} = useParallaxController();
<Animated.ScrollView ref={attachScroll} onLayout={handleContainerLayout} >
    <Parallax speed={10} style={{width: '100%', height: '60'}}> //View translates in parallax vertically depending on speed
    <Parallax transform={[{rotate: ['0deg','360deg']}, {translateX: [-100, 100]}, {opacity: [1, 0]}]} style={{width: '100%', height: '60'}}> //add custom transforms
    //note speed and transform are mutually exclusive (using both won't cause error but will result in unexpected behavior)
    <ParallaxBanner source={asset} style={{width: '100%', height: '60'}} speed={10}> //A banner with parallax effect
    <ParallaxBanner source={asset} style={{width: '100%', height: '60'}} imageProps={{style: {resizeMode: 'repeat'}}} speed={10}> //custom prop for internal react-native Image element, note that source is outside of imageProps
</Animated.ScrollView>
// ...

```

Use with targeted element - components outside scrollview can be animated based on scroll position of the target element inside scrollview
```js
const target = useRef<any>(null);
const {attachScroll, handleContainerLayout, handleTargetLayout, registerTarget} = useParallaxController();
<Parallax className='absolute top-2 right-2 bg-pink-600 size-32 z-10' transform={[{rotate: ['0deg', '90deg']}, {opacity: [1, 0]}]} targetElement={target}/>
<Animated.ScrollView ref={attachScroll} onLayout={handleContainerLayout} >
    <View className={`${isLarge ? 'h-96' : 'h-48'} bg-foreground`} ref={(node) => {target.current = node; registerTarget(target);}} onLayout={handleTargetLayout}/> //we use a callback function for ref prop, to assign the element to ref and to register it in the controller
</Animated.ScrollView>

```
then the parallax element spins and fades along the scroll progress of the registered view component.

## Supported Transforms

Same as react-scroll-parallax, only supports transform styling (translate, rotate, scale, etc) and opacity

## NativeWind Support

You need to modify the tailwind.config.js file in your project to include this package.
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    //... some other paths
    './node_modules/@freepina/react-native-parallax-reanimated/src/*.{js,jsx,ts,tsx}'
  ],
  //... other config stuff
}


```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
