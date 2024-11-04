# parcel-validator-glsl

> Parcel validator plugin for GLSL files

This [Parcel Bundler](https://parceljs.org/) validator plugin runs [glslangValidator](https://github.com/KhronosGroup/glslang) against your GLSL files via [glslang-validator-prebuilt-predownloaded](https://www.npmjs.com/package/glslang-validator-prebuilt-predownloaded).

Parcel supports GLSL files via [@parcel/transformer-glsl](https://parceljs.org/languages/glsl/).

<br/>

## Prerequisites

## Installation

Install parcel-validator-glsl in your repo via NPM:

```bash
npm install -D parcel-validator-glsl
```

or via Yarn:

```bash
yarn add -D parcel-validator-glsl
```

or via your package manager of choice.

## Usage

Add "parcel-validator-glsl" validator to your _.parcelrc_ file:

```json
{
  "extends": "@parcel/config-default",
  "validators": {
    "*.{glsl,vert,tesc,tese,geom,frag,comp}": ["parcel-validator-glsl"]
  }
}
```

## Configuration

This plugin supports a configuration file in the root of your repo called "parcel-validator-glsl.config.json" or "parcel-validator-glsl.config.js".

### GLSL Version

GLSL files are validated as version 1.10 by default. You can change the version using either of these methods:

1. Add a `#version` directive at the top of your .glsl files, ie. `#version 130`. See [this documentation](<https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)#Version>) for more info.

   If you do this, you may also wish to use the [parcel-optimizer-glsl-remove-version](https://www.npmjs.com/package/parcel-optimizer-glsl-remove-version) package to avoid `#version directive must occur before anything else, except for comments and white space` errors.

2. Set the "glslVersion" config in "parcel-validator-glsl.config.json":

```json
{
  "glslVersion": 130
}
```

### Three.js

This plugin has inbuilt support for Three.js. This ensures the uniforms and attributes that `ShaderMaterial` prepends to your shaders are known to the validator. You can see a list of these in the [Three documentation](https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram).

Set the "threeIntegration" config in "parcel-validator-glsl.config.json":

```json
{
  "threeIntegration": true
}
```

You can exclude shaders that use `RawShaderMaterial` from this by adding this comment anywhere in the shader file:

```glsl
// parcel-validator-glsl raw
```

<br/>

---

<br/>

## Development

These are instructions for developing a fork of this package.

Install Yarn:

[Yarn >=1.22.19 <2](https://classic.yarnpkg.com) / `choco install yarn`

Initially build dependencies via this command in the project folder:

```bash
yarn install
```

Build the project via:

```bash
yarn build
```

See a full list of commands and info via:

```bash
npx npm-scripts-help
```

---

## Contributing

Feel free to submit a pull-request or fork as your own.

## Copyright & Licensing

Licensed for use under the MIT License.  
See [LICENSE](LICENSE).
