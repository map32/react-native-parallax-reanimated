package com.parallaxreanimated

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.ParallaxReanimatedViewManagerInterface
import com.facebook.react.viewmanagers.ParallaxReanimatedViewManagerDelegate

@ReactModule(name = ParallaxReanimatedViewManager.NAME)
class ParallaxReanimatedViewManager : SimpleViewManager<ParallaxReanimatedView>(),
  ParallaxReanimatedViewManagerInterface<ParallaxReanimatedView> {
  private val mDelegate: ViewManagerDelegate<ParallaxReanimatedView>

  init {
    mDelegate = ParallaxReanimatedViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<ParallaxReanimatedView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): ParallaxReanimatedView {
    return ParallaxReanimatedView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: ParallaxReanimatedView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "ParallaxReanimatedView"
  }
}
