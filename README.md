# parcel-validator-glsl

> Parcel validator plugin for GLSL files

This [Parcel Bundler](https://parceljs.org/) validator plugin runs [glslangValidator](https://github.com/KhronosGroup/glslang) against your GLSL files via [glslang-validator-prebuilt-predownloaded](https://www.npmjs.com/package/glslang-validator-prebuilt-predownloaded).

Parcel supports GLSL files via [@parcel/transformer-glsl](https://parceljs.org/languages/glsl/).

<br/>

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

You **must** use specific file extensions that correspond to the shader stages, see [supported file extensions](https://github.com/KhronosGroup/glslang?tab=readme-ov-file#execution-of-standalone-wrapper).

## Adding code only run during validation

A `VALIDATE` pre-processor macro is defined when running the validator.

If you wish to include code in your GLSL files that should only run during validation (ie. to define variables that exist at runtime, but would not otherwise be known to the validator), then you can check this constant, eg.:

```glsl
#ifdef VALIDATE
  uniform vec2 uv;
#endif
```

This is useful for things like Three.js shaders, that may prepend your GLSL files with additional code during compilation. However, additional specific support is available in this plugin to handle this use case for you, see below.

## Configuration

This plugin supports a configuration file in the root of your repo called _parcel-validator-glsl.config.json_ or _parcel-validator-glsl.config.js_.

### Exclude Files

You can exclude files from validation using either of these methods:

1. **Via a comment in files:** \
   Add this comment anywhere in the shader file:

   ```glsl
   // parcel-validator-glsl no-validate
   ```

2. **Via a config:** \
   Set the "exclude" config in _parcel-validator-glsl.config.json_:

   ```json
   {
     "exclude": ["foo.frag", "*.bar.vert"]
   }
   ```

   This is an array of file GLOB patterns.

### GLSL Version

GLSL files are validated as version 1.10 by default. You can change the version using either of these methods:

1. **Specific files via a comment:** \
   Add a `#version` directive at the top of your GLSL files, ie. `#version 130`. See [this documentation](<https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)#Version>) for more info.

   If you do this, you may also wish to use the [parcel-optimizer-glsl-remove-version](https://www.npmjs.com/package/parcel-optimizer-glsl-remove-version) package to avoid `#version directive must occur before anything else, except for comments and white space` errors.

2. **Apply to all files with a config:** \
   Set the "glslVersion" config in _parcel-validator-glsl.config.json_:

   ```json
   {
     "glslVersion": 130
   }
   ```

### Additional Command Arguments

You can define additional `glslangValidator` command line options and arguments by setting the "commandArguments" config in _parcel-validator-glsl.config.json_:

```json
{
  "commandArguments": "-Dfoo --bar"
}
```

See available options and arguments in the [glslangValidator documentation](https://manpages.debian.org/bullseye/glslang-tools/glslangValidator.1.en.html).

### Three.js

This plugin has inbuilt support for [Three.js](https://threejs.org/). This ensures the uniforms and attributes that `ShaderMaterial` prepends to your shaders are known to the validator. You can see a list of these in the [Three documentation](https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram).

You can implement this using either of these methods:

1. **Opt-in files with a comment:** \
   Add this comment anywhere in the shader file:
   ```glsl
   // parcel-validator-glsl three
   ```
2. **Apply to all files with a config:** \
   Set the "threeIntegration" config in _parcel-validator-glsl.config.json_:
   ```json
   {
     "threeIntegration": true
   }
   ```
   You can exclude shaders that use `RawShaderMaterial` from this by adding this comment anywhere in the shader file:
   ```glsl
   // parcel-validator-glsl no-three
   ```

### THREE-CustomShaderMaterial

This plugin has inbuilt support for [THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial). This ensures the output variables that `CustomShaderMaterial` injects into your shaders are known to the validator. You can see a list of these in the [CSM documentation](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial?tab=readme-ov-file#output-variables).

You can implement this using either of these methods:

1. **Opt-in files with a comment:** \
   Add this comment anywhere in the shader file:
   ```glsl
   // parcel-validator-glsl csm
   ```
2. **Apply to all files with a config:** \
   Set the "csmIntegration" config in _parcel-validator-glsl.config.json_:
   ```json
   {
     "csmIntegration": true
   }
   ```
   You can exclude shaders that don't use `CustomShaderMaterial` from this by adding this comment anywhere in the shader file:
   ```glsl
   // parcel-validator-glsl no-csm
   ```

---

## Known Issues

- Errors are not shown after a rebuild if the GLSL file has not been modified. \
  To workaround this, either:
  - Modify the GLSL file.
  - Clear the Parcel cache by deleting the `.parcel-cache` dir in the root of your repo.
- The [Three.js integration](#threejs) defines `color` attribute as a `vec4` (with alpha), your material may not use an alpha channel on the color. \
  To workaround this, add this to _parcel-validator-glsl.config.json_:
  ```json
  {
    "commandArguments": "-DVALIDATE_THREE_NO_COLOR"
  }
  ```
  And add this code to your vertex shader:
  ```glsl
  #ifdef VALIDATE
    // Three.js vertex color attribute
    attribute vec3 color;
  #endif
  ```
  Vertex shaders that do use color with an alpha channel will then need this code:
  ```glsl
  #ifdef VALIDATE
    // Three.js vertex color attribute with alpha
    attribute vec4 color;
  #endif
  ```
- The [THREE-CustomShaderMaterial integration](#three-customshadermaterial) only includes builtin support for its export variables. The uniforms, attributes, variables and functions defined by the particular Three shader you choose to override will not be known by the validator. \
  To workaround this, you can define them yourself, see [adding code only run during validation](#adding-code-only-run-during-validation).

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
