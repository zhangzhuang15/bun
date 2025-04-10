// Portions of this file are derived from works under the MIT License:
//
// Copyright (c) 2014-present, Jon Schlinkert
// Copyright (c) 2023 Devon Govett
// Copyright (c) 2023 Stephen Gregoratto
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { Glob } from "bun";
import { describe, expect, test } from "bun:test";
import { isWindows } from "harness";
import { join } from "path";

describe("Glob.match", () => {
  test("WTF", () => {
    // let glob = new Glob("C:\\Users\\window\\AppData\\Local\\Temp\\testworkspace_V7osKW\\**");
    // expect(glob.match("C:\\Users\\window\\AppData\\Local\\Temp\\testworkspace_V7osKW\\packages\\malfored1")).toBeTrue();
  });

  test("single wildcard", () => {
    let glob: Glob;

    glob = new Glob("*");
    expect(glob.match("foo")).toBeTrue();
    expect(glob.match("lmao.ts")).toBeTrue();
    expect(glob.match("")).toBeTrue();
    expect(glob.match("   ")).toBeTrue();
    expect(glob.match("*")).toBeTrue();

    glob = new Glob("*.ts");
    expect(glob.match("foo.ts")).toBeTrue();
    expect(glob.match(".ts")).toBeTrue();
    expect(glob.match("")).toBeFalse();
    expect(glob.match("bar.tsx")).toBeFalse();
    expect(glob.match("foo/bar.ts")).toBeFalse();
    expect(glob.match("foo/bar/baz.ts")).toBeFalse();

    glob = new Glob("src/*/*.ts");
    expect(glob.match("src/foo/bar.ts")).toBeTrue();
    expect(glob.match("src/bar.ts")).toBeFalse();

    glob = new Glob("src/**/hehe.ts");
    expect(glob.match("src/foo/baz/lol/hehe.ts")).toBeTrue();
  });

  test("double wildcard", () => {
    let glob: Glob;

    glob = new Glob("**");
    // FIXME: should this match?
    expect(glob.match("")).toBeTrue();
    expect(glob.match("nice/wow/great/foo.ts")).toBeTrue();

    glob = new Glob("foo/**/bar");
    expect(glob.match("")).toBeFalse();
    expect(glob.match("foo/lmao/lol/bar")).toBeTrue();
    expect(glob.match("foo/lmao/lol/haha/wtf/nice/bar")).toBeTrue();
    expect(glob.match("foo/bar")).toBeTrue();

    glob = new Glob("src/**/*.ts");
    expect(glob.match("src/foo/bar/baz/nice.ts")).toBeTrue();
    expect(glob.match("src/foo/bar/nice.ts")).toBeTrue();
    expect(glob.match("src/nice.ts")).toBeTrue();

    glob = new Glob("src/foo/*/bar/**/*.ts");
    expect(glob.match("src/foo/nice/bar/baz/lmao.ts")).toBeTrue();
    expect(glob.match("src/foo/nice/bar/baz/lmao.ts")).toBeTrue();
  });

  test("no early globstar lock-in", () => {
    // see https://github.com/oven-sh/bun/issues/14934
    expect(new Glob(`**/*abc*`).match(`a/abc`)).toBeTrue();
    expect(new Glob(`**/*.js`).match(`a/b.c/c.js`)).toBeTrue();
    expect(new Glob("/**/*a").match("/a/a")).toBeTrue();
    expect(new Glob("**/*.js").match("a/b.c/c.js")).toBeTrue();
    expect(new Glob("**/**/*.js").match("a/b.c/c.js")).toBeTrue();
    expect(new Glob("a/**/*.d").match("a/b/c.d")).toBeTrue();
    expect(new Glob("a/**/*.d").match("a/.b/c.d")).toBeTrue();
    expect(new Glob("**/*/**").match("a/b/c")).toBeTrue();
    expect(new Glob("**/*/c.js").match("a/b/c.js")).toBeTrue();
  });

  test("braces", async () => {
    let glob: Glob;

    glob = new Glob("index.{ts,tsx,js,jsx}");
    expect(glob.match("index.ts")).toBeTrue();
    expect(glob.match("index.tsx")).toBeTrue();
    expect(glob.match("index.js")).toBeTrue();
    expect(glob.match("index.jsx")).toBeTrue();
    expect(glob.match("index.jsxxxxxxxx")).toBeFalse();

    glob = new Glob("foo{bar,b*z}");
    expect(glob.match("foobar")).toBeTrue();
    expect(glob.match("foobuzz")).toBeTrue();
    expect(glob.match("foobarz")).toBeTrue();

    glob = new Glob("{a}/{b}/");
    expect(glob.match("a/b/")).toBeTrue();

    glob = new Glob("{a,b}/c/{d,e}/**/*est.ts");
    expect(glob.match("a/c/d/one/two/three.test.ts"));

    glob = new Glob("{a,{d,e}b}/c");
    expect(glob.match("a/c")).toBeTrue();

    glob = new Glob("{**/a,**/b}");
    expect(glob.match("b")).toBeTrue();

    const fixtures = [
      {
        pattern: "{src,extensions}/**/test/**/{fixtures,browser,common}/**/*.{ts,js}",
        expectedMatches: "matched-0.txt",
      },
      { pattern: "{extensions,src}/**/{media,images,icons}/**/*.{svg,png,gif,jpg}", expectedMatches: "matched-1.txt" },
      {
        pattern: "{.github,build,test}/**/{workflows,azure-pipelines,integration,smoke}/**/*.{yml,yaml,json}",
        expectedMatches: "matched-2.txt",
      },
      {
        pattern: "src/vs/{base,editor,platform,workbench}/test/{browser,common,node}/**/[a-z]*[tT]est.ts",
        expectedMatches: "matched-3.txt",
      },
      {
        pattern: "src/vs/workbench/{contrib,services}/**/*{Editor,Workspace,Terminal}*.ts",
        expectedMatches: "matched-4.txt",
      },
      {
        pattern: "{extensions,src}/**/{markdown,json,javascript,typescript}/**/*.{ts,json}",
        expectedMatches: "matched-5.txt",
      },
      {
        pattern: "**/{electron-sandbox,electron-main,browser,node}/**/{*[sS]ervice*,*[cC]ontroller*}.ts",
        expectedMatches: "matched-6.txt",
      },
      {
        pattern: "{src,extensions}/**/{common,browser,electron-sandbox}/**/*{[cC]ontribution,[sS]ervice}.ts",
        expectedMatches: "matched-7.txt",
      },
      {
        pattern: "src/vs/{base,platform,workbench}/**/{test,browser}/**/*{[mM]odel,[cC]ontroller}*.ts",
        expectedMatches: "matched-8.txt",
      },
      {
        pattern: "extensions/**/{browser,common,node}/{**/*[sS]ervice*,**/*[pP]rovider*}.ts",
        expectedMatches: "matched-9.txt",
      },
    ];

    const allFilePaths = (
      await Bun.file(join(import.meta.dir, "..", "..", "..", "fixtures", "glob", "filelist.txt")).text()
    ).split("\n");

    for (const { pattern, expectedMatches } of fixtures) {
      const shouldMatch = (
        await Bun.file(join(import.meta.dir, "..", "..", "..", "fixtures", "glob", `${expectedMatches}`)).text()
      ).split("\n");

      glob = new Glob(pattern);
      let matched: string[] = [];
      for (const filepath of allFilePaths) {
        if (glob.match(filepath)) {
          matched.push(filepath);
        }
      }

      expect(matched).toEqual(shouldMatch);
    }
  });

  test("nested braces", () => {
    let glob: Glob;

    // Basic single-level nesting
    // ("a{b,c{d,e}}f", ["abf", "acdf", "acef"]),
    glob = new Glob("a{b,c{d,e}}f");
    expect(glob.match("abf")).toBeTrue();
    expect(glob.match("acdf")).toBeTrue();
    expect(glob.match("acef")).toBeTrue();

    // Two levels deep
    glob = new Glob("x{1,2{3,4}}y");
    expect(glob.match("x1y")).toBeTrue();
    expect(glob.match("x23y")).toBeTrue();
    expect(glob.match("x24y")).toBeTrue();

    glob = new Glob("a{b,c{d,e},f}g");
    expect(glob.match("abg")).toBeTrue();
    expect(glob.match("acdg")).toBeTrue();
    expect(glob.match("aceg")).toBeTrue();
    expect(glob.match("afg")).toBeTrue();

    // Three levels deep
    glob = new Glob("1{2,3{4,5{6,7}}}8");
    expect(glob.match("128")).toBeTrue();
    expect(glob.match("1348")).toBeTrue();
    expect(glob.match("13568")).toBeTrue();
    expect(glob.match("13578")).toBeTrue();

    // Four levels deep
    glob = new Glob("{a,b{c,d{e,f{g,h}}}}i");
    expect(glob.match("ai")).toBeTrue();
    expect(glob.match("bci")).toBeTrue();
    expect(glob.match("bdei")).toBeTrue();
    expect(glob.match("bdfgi")).toBeTrue();
    expect(glob.match("bdfhi")).toBeTrue();

    // Five levels deep
    glob = new Glob("v{w,x{y,z{1,2{3,4{5,6}}}}}7");
    expect(glob.match("vw7")).toBeTrue();
    expect(glob.match("vxy7")).toBeTrue();
    expect(glob.match("vxz17")).toBeTrue();
    expect(glob.match("vxz237")).toBeTrue();
    expect(glob.match("vxz2457")).toBeTrue();
    expect(glob.match("vxz2467")).toBeTrue();

    // Six levels deep
    glob = new Glob("a{b,c{d,e{f,g{h,i{j,k{l,m}}}}}}n");
    expect(glob.match("abn")).toBeTrue();
    expect(glob.match("acdn")).toBeTrue();
    expect(glob.match("acefn")).toBeTrue();
    expect(glob.match("aceghn")).toBeTrue();
    expect(glob.match("acegijn")).toBeTrue();
    expect(glob.match("acegikln")).toBeTrue();
    expect(glob.match("acegikmn")).toBeTrue();

    // Seven levels deep
    glob = new Glob("1{2,3{4,5{6,7{8,9{a,b{c,d{e,f}}}}}}}g");
    expect(glob.match("12g")).toBeTrue();
    expect(glob.match("134g")).toBeTrue();
    expect(glob.match("1356g")).toBeTrue();
    expect(glob.match("13578g")).toBeTrue();
    expect(glob.match("13579ag")).toBeTrue();
    expect(glob.match("13579bcg")).toBeTrue();
    expect(glob.match("13579bdeg")).toBeTrue();
    expect(glob.match("13579bdfg")).toBeTrue();

    // Eight levels deep
    glob = new Glob("p{q,r{s,t{u,v{w,x{y,z{1,2{3,4{5,6}}}}}}}}7");
    expect(glob.match("pq7")).toBeTrue();
    expect(glob.match("prs7")).toBeTrue();
    expect(glob.match("prtu7")).toBeTrue();
    expect(glob.match("prtvw7")).toBeTrue();
    expect(glob.match("prtvxy7")).toBeTrue();
    expect(glob.match("prtvxz17")).toBeTrue();
    expect(glob.match("prtvxz237")).toBeTrue();
    expect(glob.match("prtvxz2457")).toBeTrue();
    expect(glob.match("prtvxz2467")).toBeTrue();

    // Nine levels deep
    glob = new Glob("a{b,c{d,e{f,g{h,i{j,k{l,m{n,o{p,q{r,s}}}}}}}}}t");
    expect(glob.match("abt")).toBeTrue();
    expect(glob.match("acdt")).toBeTrue();
    expect(glob.match("aceft")).toBeTrue();
    expect(glob.match("aceght")).toBeTrue();
    expect(glob.match("acegijt")).toBeTrue();
    expect(glob.match("acegiklt")).toBeTrue();
    expect(glob.match("acegikmnt")).toBeTrue();
    expect(glob.match("acegikmopt")).toBeTrue();
    expect(glob.match("acegikmoqrt")).toBeTrue();
    expect(glob.match("acegikmoqst")).toBeTrue();

    // Ten levels deep
    glob = new Glob("1{2,3{4,5{6,7{8,9{a,b{c,d{e,f{g,h{i,j{k,l}}}}}}}}}}m");
    expect(glob.match("12m")).toBeTrue();
    expect(glob.match("134m")).toBeTrue();
    expect(glob.match("1356m")).toBeTrue();
    expect(glob.match("13578m")).toBeTrue();
    expect(glob.match("13579am")).toBeTrue();
    expect(glob.match("13579bcm")).toBeTrue();
    expect(glob.match("13579bdem")).toBeTrue();
    expect(glob.match("13579bdfgm")).toBeTrue();
    expect(glob.match("13579bdfhim")).toBeTrue();
    expect(glob.match("13579bdfhjkm")).toBeTrue();
    expect(glob.match("13579bdfhjlm")).toBeTrue();

    // Edge cases
    // Redundant nesting
    glob = new Glob("{a,{b,c}}");
    expect(glob.match("a")).toBeTrue();
    expect(glob.match("b")).toBeTrue();
    expect(glob.match("c")).toBeTrue();

    // Empty nested group
    glob = new Glob("{a,b{}}");
    expect(glob.match("a")).toBeTrue();
    expect(glob.match("b")).toBeTrue();

    // Empty nested group with tail
    glob = new Glob("{a,b{,c{{}}}}d");
    expect(glob.match("ad")).toBeTrue();
    expect(glob.match("bcd")).toBeTrue();

    // Leading nested group
    glob = new Glob("{{a,b},c}");
    expect(glob.match("a")).toBeTrue();
    expect(glob.match("b")).toBeTrue();
    expect(glob.match("c")).toBeTrue();

    // Empty nested group in middle
    glob = new Glob("{a,b{c,d{}}}e");
    expect(glob.match("ae")).toBeTrue();
    expect(glob.match("bce")).toBeTrue();
    expect(glob.match("bde")).toBeTrue();
  });

  // Most of the potential bugs when dealing with non-ASCII patterns is when the
  // pattern matching algorithm wants to deal with single chars, for example
  // using the `[...]` syntax, it tries to match each char in the brackets. With
  // multi-byte string encodings this will break.
  test("non ascii", () => {
    let glob: Glob;

    glob = new Glob("😎/¢£.{ts,tsx,js,jsx}");
    expect(glob.match("😎/¢£.ts")).toBeTrue();
    expect(glob.match("😎/¢£.tsx")).toBeTrue();
    expect(glob.match("😎/¢£.js")).toBeTrue();
    expect(glob.match("😎/¢£.jsx")).toBeTrue();
    expect(glob.match("😎/¢£.jsxxxxxxxx")).toBeFalse();

    // wildcard before and after non-ascii
    glob = new Glob("*é*");
    expect(glob.match("café noir")).toBeTrue();
    expect(glob.match("café noir")).toBeTrue();
    expect(glob.match("é")).toBeTrue();
    glob = new Glob("*😎");
    expect(glob.match("😎")).toBeTrue();
    expect(glob.match("ëëëëëë😎")).toBeTrue();

    // wildcard matches non-ascii
    glob = new Glob("caf*noir");
    expect(glob.match("café noir")).toBeTrue();
    expect(glob.match("café noir")).toBeTrue();
    expect(glob.match("cafeenoir")).toBeTrue();

    // character class match non-ascii
    glob = new Glob("F[ë£a]");
    expect(glob.match("Fë")).toBeTrue();
    expect(glob.match("F£")).toBeTrue();
    expect(glob.match("Fa")).toBeTrue();

    // ? matches any single character
    glob = new Glob("?ëlmao");
    expect(glob.match("ëlmao")).toBeFalse();
    expect(glob.match("ëëlmao")).toBeTrue();
    expect(glob.match("fëlmao")).toBeTrue();
    expect(glob.match("lmao")).toBeFalse();

    // braces match non-ascii
    glob = new Glob("F{ë,£,a}");
    expect(glob.match("Fë")).toBeTrue();
    expect(glob.match("F£")).toBeTrue();
    expect(glob.match("Fa")).toBeTrue();
    expect(glob.match("Fb")).toBeFalse();
    expect(glob.match("F😎")).toBeFalse();

    // escape matches non-ascii
    glob = new Glob("\\😎");
    expect(glob.match("😎")).toBeTrue();

    // invalid surrogate pairs
    glob = new Glob("\uD83D\u0027");
    expect(glob.match("lmao")).toBeFalse();

    glob = new Glob("\uD800\uD800");
    expect(glob.match("lmao")).toBeFalse();

    glob = new Glob("*");
    expect(glob.match("\uD800\uD800")).toBeTrue();

    glob = new Glob("hello/*/friends");
    expect(glob.match("hello/\uD800\uD800/friends")).toBeTrue();

    glob = new Glob("*.{js,\uD83D\u0027}");
    expect(glob.match("runtime.node.pre.out.ts")).toBeFalse();
    expect(glob.match("runtime.node.pre.out.js")).toBeTrue();
  });

  /**
   * These tests are ported from micromatch, glob-match, globlin
   */
  describe("ported from micromatch / glob-match / globlin tests", () => {
    test("basic", () => {
      expect(new Glob("abc").match("abc")).toBe(true);
      expect(new Glob("*").match("abc")).toBe(true);
      expect(new Glob("*").match("")).toBe(true);
      expect(new Glob("**").match("")).toBe(true);
      expect(new Glob("*c").match("abc")).toBe(true);
      expect(new Glob("*b").match("abc")).toBe(false);
      expect(new Glob("a*").match("abc")).toBe(true);
      expect(new Glob("b*").match("abc")).toBe(false);
      expect(new Glob("a*").match("a")).toBe(true);
      expect(new Glob("*a").match("a")).toBe(true);
      expect(new Glob("a*b*c*d*e*").match("axbxcxdxe")).toBe(true);
      expect(new Glob("a*b*c*d*e*").match("axbxcxdxexxx")).toBe(true);
      expect(new Glob("a*b?c*x").match("abxbbxdbxebxczzx")).toBe(true);
      expect(new Glob("a*b?c*x").match("abxbbxdbxebxczzy")).toBe(false);

      expect(new Glob("a/*/test").match("a/foo/test")).toBe(true);
      expect(new Glob("a/*/test").match("a/foo/bar/test")).toBe(false);
      expect(new Glob("a/**/test").match("a/foo/test")).toBe(true);
      expect(new Glob("a/**/test").match("a/foo/bar/test")).toBe(true);
      expect(new Glob("a/**/b/c").match("a/foo/bar/b/c")).toBe(true);
      expect(new Glob("a\\*b").match("a*b")).toBe(true);
      expect(new Glob("a\\*b").match("axb")).toBe(false);

      expect(new Glob("[abc]").match("a")).toBe(true);
      expect(new Glob("[abc]").match("b")).toBe(true);
      expect(new Glob("[abc]").match("c")).toBe(true);
      expect(new Glob("[abc]").match("d")).toBe(false);
      expect(new Glob("x[abc]x").match("xax")).toBe(true);
      expect(new Glob("x[abc]x").match("xbx")).toBe(true);
      expect(new Glob("x[abc]x").match("xcx")).toBe(true);
      expect(new Glob("x[abc]x").match("xdx")).toBe(false);
      expect(new Glob("x[abc]x").match("xay")).toBe(false);
      expect(new Glob("[?]").match("?")).toBe(true);
      expect(new Glob("[?]").match("a")).toBe(false);
      expect(new Glob("[*]").match("*")).toBe(true);
      expect(new Glob("[*]").match("a")).toBe(false);

      expect(new Glob("[a-cx]").match("a")).toBe(true);
      expect(new Glob("[a-cx]").match("b")).toBe(true);
      expect(new Glob("[a-cx]").match("c")).toBe(true);
      expect(new Glob("[a-cx]").match("d")).toBe(false);
      expect(new Glob("[a-cx]").match("x")).toBe(true);

      expect(new Glob("[^abc]").match("a")).toBe(false);
      expect(new Glob("[^abc]").match("b")).toBe(false);
      expect(new Glob("[^abc]").match("c")).toBe(false);
      expect(new Glob("[^abc]").match("d")).toBe(true);
      expect(new Glob("[!abc]").match("a")).toBe(false);
      expect(new Glob("[!abc]").match("b")).toBe(false);
      expect(new Glob("[!abc]").match("c")).toBe(false);
      expect(new Glob("[!abc]").match("d")).toBe(true);
      expect(new Glob("[\\!]").match("!")).toBe(true);

      expect(new Glob("a*b*[cy]*d*e*").match("axbxcxdxexxx")).toBe(true);
      expect(new Glob("a*b*[cy]*d*e*").match("axbxyxdxexxx")).toBe(true);
      expect(new Glob("a*b*[cy]*d*e*").match("axbxxxyxdxexxx")).toBe(true);

      expect(new Glob("test.{jpg,png}").match("test.jpg")).toBe(true);
      expect(new Glob("test.{jpg,png}").match("test.png")).toBe(true);
      expect(new Glob("test.{j*g,p*g}").match("test.jpg")).toBe(true);
      expect(new Glob("test.{j*g,p*g}").match("test.jpxxxg")).toBe(true);
      expect(new Glob("test.{j*g,p*g}").match("test.jxg")).toBe(true);
      expect(new Glob("test.{j*g,p*g}").match("test.jnt")).toBe(false);
      expect(new Glob("test.{j*g,j*c}").match("test.jnc")).toBe(true);
      expect(new Glob("test.{jpg,p*g}").match("test.png")).toBe(true);
      expect(new Glob("test.{jpg,p*g}").match("test.pxg")).toBe(true);
      expect(new Glob("test.{jpg,p*g}").match("test.pnt")).toBe(false);
      expect(new Glob("test.{jpeg,png}").match("test.jpeg")).toBe(true);
      expect(new Glob("test.{jpeg,png}").match("test.jpg")).toBe(false);
      expect(new Glob("test.{jpeg,png}").match("test.png")).toBe(true);
      expect(new Glob("test.{jp\\,g,png}").match("test.jp,g")).toBe(true);
      expect(new Glob("test.{jp\\,g,png}").match("test.jxg")).toBe(false);
      expect(new Glob("test/{foo,bar}/baz").match("test/foo/baz")).toBe(true);
      expect(new Glob("test/{foo,bar}/baz").match("test/bar/baz")).toBe(true);
      expect(new Glob("test/{foo,bar}/baz").match("test/baz/baz")).toBe(false);
      expect(new Glob("test/{foo*,bar*}/baz").match("test/foooooo/baz")).toBe(true);
      expect(new Glob("test/{foo*,bar*}/baz").match("test/barrrrr/baz")).toBe(true);
      expect(new Glob("test/{*foo,*bar}/baz").match("test/xxxxfoo/baz")).toBe(true);
      expect(new Glob("test/{*foo,*bar}/baz").match("test/xxxxbar/baz")).toBe(true);
      expect(new Glob("test/{foo/**,bar}/baz").match("test/bar/baz")).toBe(true);
      expect(new Glob("test/{foo/**,bar}/baz").match("test/bar/test/baz")).toBe(false);

      expect(new Glob("*.txt").match("some/big/path/to/the/needle.txt")).toBe(false);
      expect(
        new Glob("some/**/needle.{js,tsx,mdx,ts,jsx,txt}").match("some/a/bigger/path/to/the/crazy/needle.txt"),
      ).toBe(true);
      expect(new Glob("some/**/{a,b,c}/**/needle.txt").match("some/foo/a/bigger/path/to/the/crazy/needle.txt")).toBe(
        true,
      );
      expect(new Glob("some/**/{a,b,c}/**/needle.txt").match("some/foo/d/bigger/path/to/the/crazy/needle.txt")).toBe(
        false,
      );
      expect(new Glob("a/{a{a,b},b}").match("a/aa")).toBe(true);
      expect(new Glob("a/{a{a,b},b}").match("a/ab")).toBe(true);
      expect(new Glob("a/{a{a,b},b}").match("a/ac")).toBe(false);
      expect(new Glob("a/{a{a,b},b}").match("a/b")).toBe(true);
      expect(new Glob("a/{a{a,b},b}").match("a/c")).toBe(false);
      expect(new Glob("a/{b,c[}]*}").match("a/b")).toBe(true);
      expect(new Glob("a/{b,c[}]*}").match("a/c}xx")).toBe(true);
    });

    // The below tests are based on Bash and micromatch.
    // https://github.com/micromatch/picomatch/blob/master/test/bash.js
    test("bash", () => {
      expect(new Glob("a*").match("*")).toBeFalse();
      expect(new Glob("a*").match("**")).toBeFalse();
      expect(new Glob("a*").match("\\*")).toBeFalse();
      expect(new Glob("a*").match("a/*")).toBeFalse();
      expect(new Glob("a*").match("b")).toBeFalse();
      expect(new Glob("a*").match("bc")).toBeFalse();
      expect(new Glob("a*").match("bcd")).toBeFalse();
      expect(new Glob("a*").match("bdir/")).toBeFalse();
      expect(new Glob("a*").match("Beware")).toBeFalse();
      expect(new Glob("a*").match("a")).toBeTrue();
      expect(new Glob("a*").match("ab")).toBeTrue();
      expect(new Glob("a*").match("abc")).toBeTrue();

      expect(new Glob("\\a*").match("*")).toBeFalse();
      expect(new Glob("\\a*").match("**")).toBeFalse();
      expect(new Glob("\\a*").match("\\*")).toBeFalse();

      expect(new Glob("\\a*").match("a")).toBeTrue();
      expect(new Glob("\\a*").match("a/*")).toBeFalse();
      expect(new Glob("\\a*").match("abc")).toBeTrue();
      expect(new Glob("\\a*").match("abd")).toBeTrue();
      expect(new Glob("\\a*").match("abe")).toBeTrue();
      expect(new Glob("\\a*").match("b")).toBeFalse();
      expect(new Glob("\\a*").match("bb")).toBeFalse();
      expect(new Glob("\\a*").match("bcd")).toBeFalse();
      expect(new Glob("\\a*").match("bdir/")).toBeFalse();
      expect(new Glob("\\a*").match("Beware")).toBeFalse();
      expect(new Glob("\\a*").match("c")).toBeFalse();
      expect(new Glob("\\a*").match("ca")).toBeFalse();
      expect(new Glob("\\a*").match("cb")).toBeFalse();
      expect(new Glob("\\a*").match("d")).toBeFalse();
      expect(new Glob("\\a*").match("dd")).toBeFalse();
      expect(new Glob("\\a*").match("de")).toBeFalse();
    });

    test("bash directories", () => {
      expect(new Glob("b*/").match("*")).toBeFalse();
      expect(new Glob("b*/").match("**")).toBeFalse();
      expect(new Glob("b*/").match("\\*")).toBeFalse();
      expect(new Glob("b*/").match("a")).toBeFalse();
      expect(new Glob("b*/").match("a/*")).toBeFalse();
      expect(new Glob("b*/").match("abc")).toBeFalse();
      expect(new Glob("b*/").match("abd")).toBeFalse();
      expect(new Glob("b*/").match("abe")).toBeFalse();
      expect(new Glob("b*/").match("b")).toBeFalse();
      expect(new Glob("b*/").match("bb")).toBeFalse();
      expect(new Glob("b*/").match("bcd")).toBeFalse();
      expect(new Glob("b*/").match("bdir/")).toBeTrue();
      expect(new Glob("b*/").match("Beware")).toBeFalse();
      expect(new Glob("b*/").match("c")).toBeFalse();
      expect(new Glob("b*/").match("ca")).toBeFalse();
      expect(new Glob("b*/").match("cb")).toBeFalse();
      expect(new Glob("b*/").match("d")).toBeFalse();
      expect(new Glob("b*/").match("dd")).toBeFalse();
      expect(new Glob("b*/").match("de")).toBeFalse();
    });

    test("bash escaping", () => {
      expect(new Glob("\\^").match("*")).toBeFalse();
      expect(new Glob("\\^").match("**")).toBeFalse();
      expect(new Glob("\\^").match("\\*")).toBeFalse();
      expect(new Glob("\\^").match("a")).toBeFalse();
      expect(new Glob("\\^").match("a/*")).toBeFalse();
      expect(new Glob("\\^").match("abc")).toBeFalse();
      expect(new Glob("\\^").match("abd")).toBeFalse();
      expect(new Glob("\\^").match("abe")).toBeFalse();
      expect(new Glob("\\^").match("b")).toBeFalse();
      expect(new Glob("\\^").match("bb")).toBeFalse();
      expect(new Glob("\\^").match("bcd")).toBeFalse();
      expect(new Glob("\\^").match("bdir/")).toBeFalse();
      expect(new Glob("\\^").match("Beware")).toBeFalse();
      expect(new Glob("\\^").match("c")).toBeFalse();
      expect(new Glob("\\^").match("ca")).toBeFalse();
      expect(new Glob("\\^").match("cb")).toBeFalse();
      expect(new Glob("\\^").match("d")).toBeFalse();
      expect(new Glob("\\^").match("dd")).toBeFalse();
      expect(new Glob("\\^").match("de")).toBeFalse();

      expect(new Glob("\\*").match("*")).toBeTrue();
      // expect(new Glob("\\*").match("\\*")).toBeTrue(); // This line is commented out in the original test
      expect(new Glob("\\*").match("**")).toBeFalse();
      expect(new Glob("\\*").match("a")).toBeFalse();
      expect(new Glob("\\*").match("a/*")).toBeFalse();
      expect(new Glob("\\*").match("abc")).toBeFalse();
      expect(new Glob("\\*").match("abd")).toBeFalse();
      expect(new Glob("\\*").match("abe")).toBeFalse();
      expect(new Glob("\\*").match("b")).toBeFalse();
      expect(new Glob("\\*").match("bb")).toBeFalse();
      expect(new Glob("\\*").match("bcd")).toBeFalse();
      expect(new Glob("\\*").match("bdir/")).toBeFalse();
      expect(new Glob("\\*").match("Beware")).toBeFalse();
      expect(new Glob("\\*").match("c")).toBeFalse();
      expect(new Glob("\\*").match("ca")).toBeFalse();
      expect(new Glob("\\*").match("cb")).toBeFalse();
      expect(new Glob("\\*").match("d")).toBeFalse();
      expect(new Glob("\\*").match("dd")).toBeFalse();
      expect(new Glob("\\*").match("de")).toBeFalse();

      expect(new Glob("a\\*").match("*")).toBeFalse();
      expect(new Glob("a\\*").match("**")).toBeFalse();
      expect(new Glob("a\\*").match("\\*")).toBeFalse();
      expect(new Glob("a\\*").match("a")).toBeFalse();
      expect(new Glob("a\\*").match("a/*")).toBeFalse();
      expect(new Glob("a\\*").match("abc")).toBeFalse();
      expect(new Glob("a\\*").match("abd")).toBeFalse();
      expect(new Glob("a\\*").match("abe")).toBeFalse();
      expect(new Glob("a\\*").match("b")).toBeFalse();
      expect(new Glob("a\\*").match("bb")).toBeFalse();
      expect(new Glob("a\\*").match("bcd")).toBeFalse();
      expect(new Glob("a\\*").match("bdir/")).toBeFalse();
      expect(new Glob("a\\*").match("Beware")).toBeFalse();
      expect(new Glob("a\\*").match("c")).toBeFalse();
      expect(new Glob("a\\*").match("ca")).toBeFalse();
      expect(new Glob("a\\*").match("cb")).toBeFalse();
      expect(new Glob("a\\*").match("d")).toBeFalse();
      expect(new Glob("a\\*").match("dd")).toBeFalse();
      expect(new Glob("a\\*").match("de")).toBeFalse();

      expect(new Glob("*q*").match("aqa")).toBeTrue();
      expect(new Glob("*q*").match("aaqaa")).toBeTrue();
      expect(new Glob("*q*").match("*")).toBeFalse();
      expect(new Glob("*q*").match("**")).toBeFalse();
      expect(new Glob("*q*").match("\\*")).toBeFalse();
      expect(new Glob("*q*").match("a")).toBeFalse();
      expect(new Glob("*q*").match("a/*")).toBeFalse();
      expect(new Glob("*q*").match("abc")).toBeFalse();
      expect(new Glob("*q*").match("abd")).toBeFalse();
      expect(new Glob("*q*").match("abe")).toBeFalse();
      expect(new Glob("*q*").match("b")).toBeFalse();
      expect(new Glob("*q*").match("bb")).toBeFalse();
      expect(new Glob("*q*").match("bcd")).toBeFalse();
      expect(new Glob("*q*").match("bdir/")).toBeFalse();
      expect(new Glob("*q*").match("Beware")).toBeFalse();
      expect(new Glob("*q*").match("c")).toBeFalse();
      expect(new Glob("*q*").match("ca")).toBeFalse();
      expect(new Glob("*q*").match("cb")).toBeFalse();
      expect(new Glob("*q*").match("d")).toBeFalse();
      expect(new Glob("*q*").match("dd")).toBeFalse();
      expect(new Glob("*q*").match("de")).toBeFalse();

      expect(new Glob("\\**").match("*")).toBeTrue();
      expect(new Glob("\\**").match("**")).toBeTrue();
      expect(new Glob("\\**").match("\\*")).toBeFalse();
      expect(new Glob("\\**").match("a")).toBeFalse();
      expect(new Glob("\\**").match("a/*")).toBeFalse();
      expect(new Glob("\\**").match("abc")).toBeFalse();
      expect(new Glob("\\**").match("abd")).toBeFalse();
      expect(new Glob("\\**").match("abe")).toBeFalse();
      expect(new Glob("\\**").match("b")).toBeFalse();
      expect(new Glob("\\**").match("bb")).toBeFalse();
      expect(new Glob("\\**").match("bcd")).toBeFalse();
      expect(new Glob("\\**").match("bdir/")).toBeFalse();
      expect(new Glob("\\**").match("Beware")).toBeFalse();
      expect(new Glob("\\**").match("c")).toBeFalse();
      expect(new Glob("\\**").match("ca")).toBeFalse();
      expect(new Glob("\\**").match("cb")).toBeFalse();
      expect(new Glob("\\**").match("d")).toBeFalse();
      expect(new Glob("\\**").match("dd")).toBeFalse();
      expect(new Glob("\\**").match("de")).toBeFalse();
    });

    test("bash classes", () => {
      expect(new Glob("a*[^c]").match("*")).toBeFalse();
      expect(new Glob("a*[^c]").match("**")).toBeFalse();
      expect(new Glob("a*[^c]").match("\\*")).toBeFalse();
      expect(new Glob("a*[^c]").match("a")).toBeFalse();
      expect(new Glob("a*[^c]").match("a/*")).toBeFalse();
      expect(new Glob("a*[^c]").match("abc")).toBeFalse();
      expect(new Glob("a*[^c]").match("abd")).toBeTrue();
      expect(new Glob("a*[^c]").match("abe")).toBeTrue();
      expect(new Glob("a*[^c]").match("b")).toBeFalse();
      expect(new Glob("a*[^c]").match("bb")).toBeFalse();
      expect(new Glob("a*[^c]").match("bcd")).toBeFalse();
      expect(new Glob("a*[^c]").match("bdir/")).toBeFalse();
      expect(new Glob("a*[^c]").match("Beware")).toBeFalse();
      expect(new Glob("a*[^c]").match("c")).toBeFalse();
      expect(new Glob("a*[^c]").match("ca")).toBeFalse();
      expect(new Glob("a*[^c]").match("cb")).toBeFalse();
      expect(new Glob("a*[^c]").match("d")).toBeFalse();
      expect(new Glob("a*[^c]").match("dd")).toBeFalse();
      expect(new Glob("a*[^c]").match("de")).toBeFalse();
      expect(new Glob("a*[^c]").match("baz")).toBeFalse();
      expect(new Glob("a*[^c]").match("bzz")).toBeFalse();
      expect(new Glob("a*[^c]").match("BZZ")).toBeFalse();
      expect(new Glob("a*[^c]").match("beware")).toBeFalse();
      expect(new Glob("a*[^c]").match("BewAre")).toBeFalse();
      expect(new Glob("a[X-]b").match("a-b")).toBeTrue();
      expect(new Glob("a[X-]b").match("aXb")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("*")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("a*")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("**")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("\\*")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("a")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("a123b")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("a123c")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("ab")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("a/*")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("abc")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("abd")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("abe")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("b")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("bd")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("bb")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("bcd")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("bdir/")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("Beware")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("c")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("ca")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("cb")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("d")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("dd")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("dd")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("dd")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("de")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("baz")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("bzz")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("bzz")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("BZZ")).toBeFalse();
      expect(new Glob("[a-y]*[^c]").match("beware")).toBeTrue();
      expect(new Glob("[a-y]*[^c]").match("BewAre")).toBeFalse();
      expect(new Glob("a\\*b/*").match("a*b/ooo")).toBeTrue();
      expect(new Glob("a\\*?/*").match("a*b/ooo")).toBeTrue();
      expect(new Glob("a[b]c").match("*")).toBeFalse();
      expect(new Glob("a[b]c").match("**")).toBeFalse();
      expect(new Glob("a[b]c").match("\\*")).toBeFalse();
      expect(new Glob("a[b]c").match("a")).toBeFalse();
      expect(new Glob("a[b]c").match("a/*")).toBeFalse();
      expect(new Glob("a[b]c").match("abc")).toBeTrue();
      expect(new Glob("a[b]c").match("abd")).toBeFalse();
      expect(new Glob("a[b]c").match("abe")).toBeFalse();
      expect(new Glob("a[b]c").match("b")).toBeFalse();
      expect(new Glob("a[b]c").match("bb")).toBeFalse();
      expect(new Glob("a[b]c").match("bcd")).toBeFalse();
      expect(new Glob("a[b]c").match("bdir/")).toBeFalse();
      expect(new Glob("a[b]c").match("Beware")).toBeFalse();
      expect(new Glob("a[b]c").match("c")).toBeFalse();
      expect(new Glob("a[b]c").match("ca")).toBeFalse();
      expect(new Glob("a[b]c").match("cb")).toBeFalse();
      expect(new Glob("a[b]c").match("d")).toBeFalse();
      expect(new Glob("a[b]c").match("dd")).toBeFalse();
      expect(new Glob("a[b]c").match("de")).toBeFalse();
      expect(new Glob("a[b]c").match("baz")).toBeFalse();
      expect(new Glob("a[b]c").match("bzz")).toBeFalse();
      expect(new Glob("a[b]c").match("BZZ")).toBeFalse();
      expect(new Glob("a[b]c").match("beware")).toBeFalse();
      expect(new Glob("a[b]c").match("BewAre")).toBeFalse();
      expect(new Glob('a["b"]c').match("*")).toBeFalse();
      expect(new Glob('a["b"]c').match("**")).toBeFalse();
      expect(new Glob('a["b"]c').match("\\*")).toBeFalse();
      expect(new Glob('a["b"]c').match("a")).toBeFalse();
      expect(new Glob('a["b"]c').match("a/*")).toBeFalse();
      expect(new Glob('a["b"]c').match("abc")).toBeTrue();
      expect(new Glob('a["b"]c').match("abd")).toBeFalse();
      expect(new Glob('a["b"]c').match("abe")).toBeFalse();
      expect(new Glob('a["b"]c').match("b")).toBeFalse();
      expect(new Glob('a["b"]c').match("bb")).toBeFalse();
      expect(new Glob('a["b"]c').match("bcd")).toBeFalse();
      expect(new Glob('a["b"]c').match("bdir/")).toBeFalse();
      expect(new Glob('a["b"]c').match("Beware")).toBeFalse();
      expect(new Glob('a["b"]c').match("c")).toBeFalse();
      expect(new Glob('a["b"]c').match("ca")).toBeFalse();
      expect(new Glob('a["b"]c').match("cb")).toBeFalse();
      expect(new Glob('a["b"]c').match("d")).toBeFalse();
      expect(new Glob('a["b"]c').match("dd")).toBeFalse();
      expect(new Glob('a["b"]c').match("de")).toBeFalse();
      expect(new Glob('a["b"]c').match("baz")).toBeFalse();
      expect(new Glob('a["b"]c').match("bzz")).toBeFalse();
      expect(new Glob('a["b"]c').match("BZZ")).toBeFalse();
      expect(new Glob('a["b"]c').match("beware")).toBeFalse();
      expect(new Glob('a["b"]c').match("BewAre")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("*")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("**")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("\\*")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("a")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("a/*")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("abc")).toBeTrue();
      expect(new Glob("a[\\\\b]c").match("abd")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("abe")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("b")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("bb")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("bcd")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("bdir/")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("Beware")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("c")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("ca")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("cb")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("d")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("dd")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("de")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("baz")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("bzz")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("BZZ")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("beware")).toBeFalse();
      expect(new Glob("a[\\\\b]c").match("BewAre")).toBeFalse();
      expect(new Glob("a[\\b]c").match("*")).toBeFalse();
      expect(new Glob("a[\\b]c").match("**")).toBeFalse();
      expect(new Glob("a[\\b]c").match("\\*")).toBeFalse();
      expect(new Glob("a[\\b]c").match("a")).toBeFalse();
      expect(new Glob("a[\\b]c").match("a/*")).toBeFalse();
      expect(new Glob("a[\\b]c").match("abc")).toBeFalse();
      expect(new Glob("a[\\b]c").match("abd")).toBeFalse();
      expect(new Glob("a[\\b]c").match("abe")).toBeFalse();
      expect(new Glob("a[\\b]c").match("b")).toBeFalse();
      expect(new Glob("a[\\b]c").match("bb")).toBeFalse();
      expect(new Glob("a[\\b]c").match("bcd")).toBeFalse();
      expect(new Glob("a[\\b]c").match("bdir/")).toBeFalse();
      expect(new Glob("a[\\b]c").match("Beware")).toBeFalse();
      expect(new Glob("a[\\b]c").match("c")).toBeFalse();
      expect(new Glob("a[\\b]c").match("ca")).toBeFalse();
      expect(new Glob("a[\\b]c").match("cb")).toBeFalse();
      expect(new Glob("a[\\b]c").match("d")).toBeFalse();
      expect(new Glob("a[\\b]c").match("dd")).toBeFalse();
      expect(new Glob("a[\\b]c").match("de")).toBeFalse();
      expect(new Glob("a[\\b]c").match("baz")).toBeFalse();
      expect(new Glob("a[\\b]c").match("bzz")).toBeFalse();
      expect(new Glob("a[\\b]c").match("BZZ")).toBeFalse();
      expect(new Glob("a[\\b]c").match("beware")).toBeFalse();
      expect(new Glob("a[\\b]c").match("BewAre")).toBeFalse();
      expect(new Glob("a[b-d]c").match("*")).toBeFalse();
      expect(new Glob("a[b-d]c").match("**")).toBeFalse();
      expect(new Glob("a[b-d]c").match("\\*")).toBeFalse();
      expect(new Glob("a[b-d]c").match("a")).toBeFalse();
      expect(new Glob("a[b-d]c").match("a/*")).toBeFalse();
      expect(new Glob("a[b-d]c").match("abc")).toBeTrue();
      expect(new Glob("a[b-d]c").match("abd")).toBeFalse();
      expect(new Glob("a[b-d]c").match("abe")).toBeFalse();
      expect(new Glob("a[b-d]c").match("b")).toBeFalse();
      expect(new Glob("a[b-d]c").match("bb")).toBeFalse();
      expect(new Glob("a[b-d]c").match("bcd")).toBeFalse();
      expect(new Glob("a[b-d]c").match("bdir/")).toBeFalse();
      expect(new Glob("a[b-d]c").match("Beware")).toBeFalse();
      expect(new Glob("a[b-d]c").match("c")).toBeFalse();
      expect(new Glob("a[b-d]c").match("ca")).toBeFalse();
      expect(new Glob("a[b-d]c").match("cb")).toBeFalse();
      expect(new Glob("a[b-d]c").match("d")).toBeFalse();
      expect(new Glob("a[b-d]c").match("dd")).toBeFalse();
      expect(new Glob("a[b-d]c").match("de")).toBeFalse();
      expect(new Glob("a[b-d]c").match("baz")).toBeFalse();
      expect(new Glob("a[b-d]c").match("bzz")).toBeFalse();
      expect(new Glob("a[b-d]c").match("BZZ")).toBeFalse();
      expect(new Glob("a[b-d]c").match("beware")).toBeFalse();
      expect(new Glob("a[b-d]c").match("BewAre")).toBeFalse();
      expect(new Glob("a?c").match("*")).toBeFalse();
      expect(new Glob("a?c").match("**")).toBeFalse();
      expect(new Glob("a?c").match("\\*")).toBeFalse();
      expect(new Glob("a?c").match("a")).toBeFalse();
      expect(new Glob("a?c").match("a/*")).toBeFalse();
      expect(new Glob("a?c").match("abc")).toBeTrue();
      expect(new Glob("a?c").match("abd")).toBeFalse();
      expect(new Glob("a?c").match("abe")).toBeFalse();
      expect(new Glob("a?c").match("b")).toBeFalse();
      expect(new Glob("a?c").match("bb")).toBeFalse();
      expect(new Glob("a?c").match("bcd")).toBeFalse();
      expect(new Glob("a?c").match("bdir/")).toBeFalse();
      expect(new Glob("a?c").match("Beware")).toBeFalse();
      expect(new Glob("a?c").match("c")).toBeFalse();
      expect(new Glob("a?c").match("ca")).toBeFalse();
      expect(new Glob("a?c").match("cb")).toBeFalse();
      expect(new Glob("a?c").match("d")).toBeFalse();
      expect(new Glob("a?c").match("dd")).toBeFalse();
      expect(new Glob("a?c").match("de")).toBeFalse();
      expect(new Glob("a?c").match("baz")).toBeFalse();
      expect(new Glob("a?c").match("bzz")).toBeFalse();
      expect(new Glob("a?c").match("BZZ")).toBeFalse();
      expect(new Glob("a?c").match("beware")).toBeFalse();
      expect(new Glob("a?c").match("BewAre")).toBeFalse();
      expect(new Glob("*/man*/bash.*").match("man/man1/bash.1")).toBeTrue();
      expect(new Glob("[^a-c]*").match("*")).toBeTrue();
      expect(new Glob("[^a-c]*").match("**")).toBeTrue();
      expect(new Glob("[^a-c]*").match("a")).toBeFalse();
      expect(new Glob("[^a-c]*").match("a/*")).toBeFalse();
      expect(new Glob("[^a-c]*").match("abc")).toBeFalse();
      expect(new Glob("[^a-c]*").match("abd")).toBeFalse();
      expect(new Glob("[^a-c]*").match("abe")).toBeFalse();
      expect(new Glob("[^a-c]*").match("b")).toBeFalse();
      expect(new Glob("[^a-c]*").match("bb")).toBeFalse();
      expect(new Glob("[^a-c]*").match("bcd")).toBeFalse();
      expect(new Glob("[^a-c]*").match("bdir/")).toBeFalse();
      expect(new Glob("[^a-c]*").match("Beware")).toBeTrue();
      expect(new Glob("[^a-c]*").match("Beware")).toBeTrue();
      expect(new Glob("[^a-c]*").match("c")).toBeFalse();
      expect(new Glob("[^a-c]*").match("ca")).toBeFalse();
      expect(new Glob("[^a-c]*").match("cb")).toBeFalse();
      expect(new Glob("[^a-c]*").match("d")).toBeTrue();
      expect(new Glob("[^a-c]*").match("dd")).toBeTrue();
      expect(new Glob("[^a-c]*").match("de")).toBeTrue();
      expect(new Glob("[^a-c]*").match("baz")).toBeFalse();
      expect(new Glob("[^a-c]*").match("bzz")).toBeFalse();
      expect(new Glob("[^a-c]*").match("BZZ")).toBeTrue();
      expect(new Glob("[^a-c]*").match("beware")).toBeFalse();
      expect(new Glob("[^a-c]*").match("BewAre")).toBeTrue();
    });

    test("square braces", () => {
      expect(new Glob("src/*.[tj]s").match("src/foo.js")).toBeTrue();
      expect(new Glob("src/*.[tj]s").match("src/foo.ts")).toBeTrue();
      expect(new Glob("foo/ba[rz].md").match("foo/bar.md")).toBeTrue();
      expect(new Glob("foo/ba[rz].md").match("foo/baz.md")).toBeTrue();
    });

    test("bash wildmatch", () => {
      expect(new Glob("a[]-]b").match("aab")).toBeFalse();
      expect(new Glob("[ten]").match("ten")).toBeFalse();
      expect(new Glob("]").match("]")).toBeTrue();
      expect(new Glob("a[]-]b").match("a-b")).toBeTrue();
      expect(new Glob("a[]-]b").match("a]b")).toBeTrue();
      expect(new Glob("a[]]b").match("a]b")).toBeTrue();
      expect(new Glob("a[\\]a\\-]b").match("aab")).toBeTrue();
      expect(new Glob("t[a-g]n").match("ten")).toBeTrue();
      expect(new Glob("t[^a-g]n").match("ton")).toBeTrue();
    });

    test("bash slashmatch", () => {
      expect(new Glob("foo[/]bar").match("foo/bar")).toBeTrue();
      expect(new Glob("f[^eiu][^eiu][^eiu][^eiu][^eiu]r").match("foo-bar")).toBeTrue();
    });

    test("bash extra_stars", () => {
      expect(new Glob("a**c").match("bbc")).toBeFalse();
      expect(new Glob("a**c").match("abc")).toBeTrue();
      expect(new Glob("a**c").match("bbd")).toBeFalse();
      expect(new Glob("a***c").match("bbc")).toBeFalse();
      expect(new Glob("a***c").match("abc")).toBeTrue();
      expect(new Glob("a***c").match("bbd")).toBeFalse();
      expect(new Glob("a*****?c").match("bbc")).toBeFalse();
      expect(new Glob("a*****?c").match("abc")).toBeTrue();
      expect(new Glob("a*****?c").match("bbc")).toBeFalse();
      expect(new Glob("?*****??").match("bbc")).toBeTrue();
      expect(new Glob("?*****??").match("abc")).toBeTrue();
      expect(new Glob("*****??").match("bbc")).toBeTrue();
      expect(new Glob("*****??").match("abc")).toBeTrue();
      expect(new Glob("?*****?c").match("bbc")).toBeTrue();
      expect(new Glob("?*****?c").match("abc")).toBeTrue();
      expect(new Glob("?***?****c").match("bbc")).toBeTrue();
      expect(new Glob("?***?****c").match("abc")).toBeTrue();
      expect(new Glob("?***?****c").match("bbd")).toBeFalse();
      expect(new Glob("?***?****?").match("bbc")).toBeTrue();
      expect(new Glob("?***?****?").match("abc")).toBeTrue();
      expect(new Glob("?***?****").match("bbc")).toBeTrue();
      expect(new Glob("?***?****").match("abc")).toBeTrue();
      expect(new Glob("*******c").match("bbc")).toBeTrue();
      expect(new Glob("*******c").match("abc")).toBeTrue();
      expect(new Glob("*******?").match("bbc")).toBeTrue();
      expect(new Glob("*******?").match("abc")).toBeTrue();
      expect(new Glob("a*cd**?**??k").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??k").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??k***").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??***k").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??***k**").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a****c**?**??*****").match("abcdecdhjk")).toBeTrue();
    });

    test("stars", () => {
      expect(new Glob("*.js").match("a/b/c/z.js")).toBeFalse();
      expect(new Glob("*.js").match("a/b/z.js")).toBeFalse();
      expect(new Glob("*.js").match("a/z.js")).toBeFalse();
      expect(new Glob("*.js").match("z.js")).toBeTrue();
      expect(new Glob("z*.js").match("z.js")).toBeTrue();
      expect(new Glob("*/*").match("a/z")).toBeTrue();
      expect(new Glob("*/z*.js").match("a/z.js")).toBeTrue();
      expect(new Glob("a/z*.js").match("a/z.js")).toBeTrue();
      expect(new Glob("*").match("ab")).toBeTrue();
      expect(new Glob("*").match("abc")).toBeTrue();
      expect(new Glob("f*").match("bar")).toBeFalse();
      expect(new Glob("*r").match("foo")).toBeFalse();
      expect(new Glob("b*").match("foo")).toBeFalse();
      expect(new Glob("*").match("foo/bar")).toBeFalse();
      expect(new Glob("*c").match("abc")).toBeTrue();
      expect(new Glob("a*").match("abc")).toBeTrue();
      expect(new Glob("a*c").match("abc")).toBeTrue();
      expect(new Glob("*r").match("bar")).toBeTrue();
      expect(new Glob("b*").match("bar")).toBeTrue();
      expect(new Glob("f*").match("foo")).toBeTrue();
      expect(new Glob("*abc*").match("one abc two")).toBeTrue();
      expect(new Glob("a*b").match("a         b")).toBeTrue();
      expect(new Glob("*a*").match("foo")).toBeFalse();
      expect(new Glob("*a*").match("bar")).toBeTrue();
      expect(new Glob("*abc*").match("oneabctwo")).toBeTrue();
      expect(new Glob("*-bc-*").match("a-b.c-d")).toBeFalse();
      expect(new Glob("*-*.*-*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*-b*c-*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*-b.c-*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*.*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*.*-*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*.*-d").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*.c-*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*b.*d").match("a-b.c-d")).toBeTrue();
      expect(new Glob("a*.c*").match("a-b.c-d")).toBeTrue();
      expect(new Glob("a-*.*-d").match("a-b.c-d")).toBeTrue();
      expect(new Glob("*.*").match("a.b")).toBeTrue();
      expect(new Glob("*.b").match("a.b")).toBeTrue();
      expect(new Glob("a.*").match("a.b")).toBeTrue();
      expect(new Glob("a.b").match("a.b")).toBeTrue();
      expect(new Glob("**-bc-**").match("a-b.c-d")).toBeFalse();
      expect(new Glob("**-**.**-**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**-b**c-**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**-b.c-**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**.**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**.**-**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**.**-d").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**.c-**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**b.**d").match("a-b.c-d")).toBeTrue();
      expect(new Glob("a**.c**").match("a-b.c-d")).toBeTrue();
      expect(new Glob("a-**.**-d").match("a-b.c-d")).toBeTrue();
      expect(new Glob("**.**").match("a.b")).toBeTrue();
      expect(new Glob("**.b").match("a.b")).toBeTrue();
      expect(new Glob("a.**").match("a.b")).toBeTrue();
      expect(new Glob("a.b").match("a.b")).toBeTrue();
      expect(new Glob("*/*").match("/ab")).toBeTrue();
      expect(new Glob(".").match(".")).toBeTrue();
      expect(new Glob("a/").match("a/.b")).toBeFalse();
      expect(new Glob("/*").match("/ab")).toBeTrue();
      expect(new Glob("/??").match("/ab")).toBeTrue();
      expect(new Glob("/?b").match("/ab")).toBeTrue();
      expect(new Glob("/*").match("/cd")).toBeTrue();
      expect(new Glob("a").match("a")).toBeTrue();
      expect(new Glob("a/.*").match("a/.b")).toBeTrue();
      expect(new Glob("?/?").match("a/b")).toBeTrue();
      expect(new Glob("a/**/j/**/z/*.md").match("a/b/c/d/e/j/n/p/o/z/c.md")).toBeTrue();
      expect(new Glob("a/**/z/*.md").match("a/b/c/d/e/z/c.md")).toBeTrue();
      expect(new Glob("a/b/c/*.md").match("a/b/c/xyz.md")).toBeTrue();
      expect(new Glob("a/b/c/*.md").match("a/b/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/z/.a").match("a/b/z/.a")).toBeTrue();
      expect(new Glob("bz").match("a/b/z/.a")).toBeFalse();
      expect(new Glob("a/**/c/*.md").match("a/bb.bb/aa/b.b/aa/c/xyz.md")).toBeTrue();
      expect(new Glob("a/**/c/*.md").match("a/bb.bb/aa/bb/aa/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bb.bb/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bb/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bbbb/c/xyz.md")).toBeTrue();
      expect(new Glob("*").match("aaa")).toBeTrue();
      expect(new Glob("*").match("ab")).toBeTrue();
      expect(new Glob("ab").match("ab")).toBeTrue();
      expect(new Glob("*/*/*").match("aaa")).toBeFalse();
      expect(new Glob("*/*/*").match("aaa/bb/aa/rr")).toBeFalse();
      expect(new Glob("aaa*").match("aaa/bba/ccc")).toBeFalse();
      expect(new Glob("aaa/*").match("aaa/bba/ccc")).toBeFalse();
      expect(new Glob("aaa/*ccc").match("aaa/bba/ccc")).toBeFalse();
      expect(new Glob("aaa/*z").match("aaa/bba/ccc")).toBeFalse();
      expect(new Glob("*/*/*").match("aaa/bbb")).toBeFalse();
      expect(new Glob("*/*jk*/*i").match("ab/zzz/ejkl/hi")).toBeFalse();
      expect(new Glob("*/*/*").match("aaa/bba/ccc")).toBeTrue();
      expect(new Glob("aaa/**").match("aaa/bba/ccc")).toBeTrue();
      expect(new Glob("aaa/*").match("aaa/bbb")).toBeTrue();
      expect(new Glob("*/*z*/*/*i").match("ab/zzz/ejkl/hi")).toBeTrue();
      expect(new Glob("*j*i").match("abzzzejklhi")).toBeTrue();
      expect(new Glob("*").match("a")).toBeTrue();
      expect(new Glob("*").match("b")).toBeTrue();
      expect(new Glob("*").match("a/a")).toBeFalse();
      expect(new Glob("*").match("a/a/a")).toBeFalse();
      expect(new Glob("*").match("a/a/b")).toBeFalse();
      expect(new Glob("*").match("a/a/a/a")).toBeFalse();
      expect(new Glob("*").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("*/*").match("a")).toBeFalse();
      expect(new Glob("*/*").match("a/a")).toBeTrue();
      expect(new Glob("*/*").match("a/a/a")).toBeFalse();
      expect(new Glob("*/*/*").match("a")).toBeFalse();
      expect(new Glob("*/*/*").match("a/a")).toBeFalse();
      expect(new Glob("*/*/*").match("a/a/a")).toBeTrue();
      expect(new Glob("*/*/*").match("a/a/a/a")).toBeFalse();
      expect(new Glob("*/*/*/*").match("a")).toBeFalse();
      expect(new Glob("*/*/*/*").match("a/a")).toBeFalse();
      expect(new Glob("*/*/*/*").match("a/a/a")).toBeFalse();
      expect(new Glob("*/*/*/*").match("a/a/a/a")).toBeTrue();
      expect(new Glob("*/*/*/*").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("*/*/*/*/*").match("a")).toBeFalse();
      expect(new Glob("*/*/*/*/*").match("a/a")).toBeFalse();
      expect(new Glob("*/*/*/*/*").match("a/a/a")).toBeFalse();
      expect(new Glob("*/*/*/*/*").match("a/a/b")).toBeFalse();
      expect(new Glob("*/*/*/*/*").match("a/a/a/a")).toBeFalse();
      expect(new Glob("*/*/*/*/*").match("a/a/a/a/a")).toBeTrue();
      expect(new Glob("*/*/*/*/*").match("a/a/a/a/a/a")).toBeFalse();
      expect(new Glob("a/*").match("a")).toBeFalse();
      expect(new Glob("a/*").match("a/a")).toBeTrue();
      expect(new Glob("a/*").match("a/a/a")).toBeFalse();
      expect(new Glob("a/*").match("a/a/a/a")).toBeFalse();
      expect(new Glob("a/*").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/*").match("a")).toBeFalse();
      expect(new Glob("a/*/*").match("a/a")).toBeFalse();
      expect(new Glob("a/*/*").match("a/a/a")).toBeTrue();
      expect(new Glob("a/*/*").match("b/a/a")).toBeFalse();
      expect(new Glob("a/*/*").match("a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/*").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/*/*").match("a")).toBeFalse();
      expect(new Glob("a/*/*/*").match("a/a")).toBeFalse();
      expect(new Glob("a/*/*/*").match("a/a/a")).toBeFalse();
      expect(new Glob("a/*/*/*").match("a/a/a/a")).toBeTrue();
      expect(new Glob("a/*/*/*").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/*/*/*").match("a")).toBeFalse();
      expect(new Glob("a/*/*/*/*").match("a/a")).toBeFalse();
      expect(new Glob("a/*/*/*/*").match("a/a/a")).toBeFalse();
      expect(new Glob("a/*/*/*/*").match("a/a/b")).toBeFalse();
      expect(new Glob("a/*/*/*/*").match("a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/*/*/*").match("a/a/a/a/a")).toBeTrue();
      expect(new Glob("a/*/a").match("a")).toBeFalse();
      expect(new Glob("a/*/a").match("a/a")).toBeFalse();
      expect(new Glob("a/*/a").match("a/a/a")).toBeTrue();
      expect(new Glob("a/*/a").match("a/a/b")).toBeFalse();
      expect(new Glob("a/*/a").match("a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/a").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/b").match("a")).toBeFalse();
      expect(new Glob("a/*/b").match("a/a")).toBeFalse();
      expect(new Glob("a/*/b").match("a/a/a")).toBeFalse();
      expect(new Glob("a/*/b").match("a/a/b")).toBeTrue();
      expect(new Glob("a/*/b").match("a/a/a/a")).toBeFalse();
      expect(new Glob("a/*/b").match("a/a/a/a/a")).toBeFalse();
      expect(new Glob("*/**/a").match("a")).toBeFalse();
      expect(new Glob("*/**/a").match("a/a/b")).toBeFalse();
      expect(new Glob("*/**/a").match("a/a")).toBeTrue();
      expect(new Glob("*/**/a").match("a/a/a")).toBeTrue();
      expect(new Glob("*/**/a").match("a/a/a/a")).toBeTrue();
      expect(new Glob("*/**/a").match("a/a/a/a/a")).toBeTrue();
      expect(new Glob("*/").match("a")).toBeFalse();
      expect(new Glob("*/*").match("a")).toBeFalse();
      expect(new Glob("a/*").match("a")).toBeFalse();
      expect(new Glob("*").match("a/a")).toBeFalse();
      expect(new Glob("*/").match("a/a")).toBeFalse();
      expect(new Glob("*/").match("a/x/y")).toBeFalse();
      expect(new Glob("*/*").match("a/x/y")).toBeFalse();
      expect(new Glob("a/*").match("a/x/y")).toBeFalse();
      expect(new Glob("*").match("a")).toBeTrue();
      expect(new Glob("*/").match("a/")).toBeTrue();
      expect(new Glob("*{,/}").match("a/")).toBeTrue();
      expect(new Glob("*/*").match("a/a")).toBeTrue();
      expect(new Glob("a/*").match("a/a")).toBeTrue();
      expect(new Glob("a/**/*.txt").match("a.txt")).toBeFalse();
      expect(new Glob("a/**/*.txt").match("a/x/y.txt")).toBeTrue();
      expect(new Glob("a/**/*.txt").match("a/x/y/z")).toBeFalse();
      expect(new Glob("a/*.txt").match("a.txt")).toBeFalse();
      expect(new Glob("a/*.txt").match("a/b.txt")).toBeTrue();
      expect(new Glob("a/*.txt").match("a/x/y.txt")).toBeFalse();
      expect(new Glob("a/*.txt").match("a/x/y/z")).toBeFalse();
      expect(new Glob("a*.txt").match("a.txt")).toBeTrue();
      expect(new Glob("a*.txt").match("a/b.txt")).toBeFalse();
      expect(new Glob("a*.txt").match("a/x/y.txt")).toBeFalse();
      expect(new Glob("a*.txt").match("a/x/y/z")).toBeFalse();
      expect(new Glob("*.txt").match("a.txt")).toBeTrue();
      expect(new Glob("*.txt").match("a/b.txt")).toBeFalse();
      expect(new Glob("*.txt").match("a/x/y.txt")).toBeFalse();
      expect(new Glob("*.txt").match("a/x/y/z")).toBeFalse();
      expect(new Glob("a*").match("a/b")).toBeFalse();
      expect(new Glob("a/**/b").match("a/a/bb")).toBeFalse();
      expect(new Glob("a/**/b").match("a/bb")).toBeFalse();
      expect(new Glob("*/**").match("foo")).toBeFalse();
      expect(new Glob("**/").match("foo/bar")).toBeFalse();
      expect(new Glob("**/*/").match("foo/bar")).toBeFalse();
      expect(new Glob("*/*/").match("foo/bar")).toBeFalse();
      expect(new Glob("**/..").match("/home/foo/..")).toBeTrue();
      expect(new Glob("**/a").match("a")).toBeTrue();
      expect(new Glob("**").match("a/a")).toBeTrue();
      expect(new Glob("a/**").match("a/a")).toBeTrue();
      expect(new Glob("a/**").match("a/")).toBeTrue();
      expect(new Glob("**/").match("a/a")).toBeFalse();
      expect(new Glob("**/").match("a/a")).toBeFalse();
      expect(new Glob("*/**/a").match("a/a")).toBeTrue();
      expect(new Glob("*/**").match("foo/")).toBeTrue();
      expect(new Glob("**/*").match("foo/bar")).toBeTrue();
      expect(new Glob("*/*").match("foo/bar")).toBeTrue();
      expect(new Glob("*/**").match("foo/bar")).toBeTrue();
      expect(new Glob("**/").match("foo/bar/")).toBeTrue();
      expect(new Glob("**/*/").match("foo/bar/")).toBeTrue();
      expect(new Glob("*/**").match("foo/bar/")).toBeTrue();
      expect(new Glob("*/*/").match("foo/bar/")).toBeTrue();
      expect(new Glob("*/foo").match("bar/baz/foo")).toBeFalse();
      expect(new Glob("**/bar/*").match("deep/foo/bar")).toBeFalse();
      expect(new Glob("*/bar/**").match("deep/foo/bar/baz/x")).toBeFalse();
      expect(new Glob("/*").match("ef")).toBeFalse();
      expect(new Glob("foo?bar").match("foo/bar")).toBeFalse();
      expect(new Glob("**/bar*").match("foo/bar/baz")).toBeFalse();
      expect(new Glob("foo**bar").match("foo/baz/bar")).toBeFalse();
      expect(new Glob("foo*bar").match("foo/baz/bar")).toBeFalse();
      expect(new Glob("/*").match("/ab")).toBeTrue();
      expect(new Glob("/*").match("/cd")).toBeTrue();
      expect(new Glob("/*").match("/ef")).toBeTrue();
      expect(new Glob("a/**/j/**/z/*.md").match("a/b/j/c/z/x.md")).toBeTrue();
      expect(new Glob("a/**/j/**/z/*.md").match("a/j/z/x.md")).toBeTrue();
      expect(new Glob("**/foo").match("bar/baz/foo")).toBeTrue();
      expect(new Glob("**/bar/*").match("deep/foo/bar/baz")).toBeTrue();
      expect(new Glob("**/bar/**").match("deep/foo/bar/baz/")).toBeTrue();
      expect(new Glob("**/bar/*/*").match("deep/foo/bar/baz/x")).toBeTrue();
      expect(new Glob("foo/**/**/bar").match("foo/b/a/z/bar")).toBeTrue();
      expect(new Glob("foo/**/bar").match("foo/b/a/z/bar")).toBeTrue();
      expect(new Glob("foo/**/**/bar").match("foo/bar")).toBeTrue();
      expect(new Glob("foo/**/bar").match("foo/bar")).toBeTrue();
      expect(new Glob("*/bar/**").match("foo/bar/baz/x")).toBeTrue();
      expect(new Glob("foo/**/**/bar").match("foo/baz/bar")).toBeTrue();
      expect(new Glob("foo/**/bar").match("foo/baz/bar")).toBeTrue();
      expect(new Glob("**/foo").match("XXX/foo")).toBeTrue();
    });

    test("globstars", () => {
      expect(new Glob("**/*.js").match("a/b/c/d.js")).toBeTrue();
      expect(new Glob("**/*.js").match("a/b/c.js")).toBeTrue();
      expect(new Glob("**/*.js").match("a/b.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/b/c/d/e/f.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/b/c/d/e.js")).toBeTrue();
      expect(new Glob("a/b/c/**/*.js").match("a/b/c/d.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/b/c/d.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/b/d.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/d.js")).toBeFalse();
      expect(new Glob("a/b/**/*.js").match("d.js")).toBeFalse();
      expect(new Glob("**c").match("a/b/c")).toBeFalse();
      expect(new Glob("a/**c").match("a/b/c")).toBeFalse();
      expect(new Glob("a/**z").match("a/b/c")).toBeFalse();
      expect(new Glob("a/**b**/c").match("a/b/c/b/c")).toBeFalse();
      expect(new Glob("a/b/c**/*.js").match("a/b/c/d/e.js")).toBeFalse();
      expect(new Glob("a/**/b/**/c").match("a/b/c/b/c")).toBeTrue();
      expect(new Glob("a/**b**/c").match("a/aba/c")).toBeTrue();
      expect(new Glob("a/**b**/c").match("a/b/c")).toBeTrue();
      expect(new Glob("a/b/c**/*.js").match("a/b/c/d.js")).toBeTrue();
      expect(new Glob("a/**/*").match("a")).toBeFalse();
      expect(new Glob("a/**/**/*").match("a")).toBeFalse();
      expect(new Glob("a/**/**/**/*").match("a")).toBeFalse();
      expect(new Glob("**/a").match("a/")).toBeFalse();
      expect(new Glob("a/**/*").match("a/")).toBeFalse();
      expect(new Glob("a/**/**/*").match("a/")).toBeFalse();
      expect(new Glob("a/**/**/**/*").match("a/")).toBeFalse();
      expect(new Glob("**/a").match("a/b")).toBeFalse();
      expect(new Glob("a/**/j/**/z/*.md").match("a/b/c/j/e/z/c.txt")).toBeFalse();
      expect(new Glob("a/**/b").match("a/bb")).toBeFalse();
      expect(new Glob("**/a").match("a/c")).toBeFalse();
      expect(new Glob("**/a").match("a/b")).toBeFalse();
      expect(new Glob("**/a").match("a/x/y")).toBeFalse();
      expect(new Glob("**/a").match("a/b/c/d")).toBeFalse();
      expect(new Glob("**").match("a")).toBeTrue();
      expect(new Glob("**/a").match("a")).toBeTrue();
      expect(new Glob("**").match("a/")).toBeTrue();
      expect(new Glob("**/a/**").match("a/")).toBeTrue();
      expect(new Glob("a/**").match("a/")).toBeTrue();
      expect(new Glob("a/**/**").match("a/")).toBeTrue();
      expect(new Glob("**/a").match("a/a")).toBeTrue();
      expect(new Glob("**").match("a/b")).toBeTrue();
      expect(new Glob("*/*").match("a/b")).toBeTrue();
      expect(new Glob("a/**").match("a/b")).toBeTrue();
      expect(new Glob("a/**/*").match("a/b")).toBeTrue();
      expect(new Glob("a/**/**/*").match("a/b")).toBeTrue();
      expect(new Glob("a/**/**/**/*").match("a/b")).toBeTrue();
      expect(new Glob("a/**/b").match("a/b")).toBeTrue();
      expect(new Glob("**").match("a/b/c")).toBeTrue();
      expect(new Glob("**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("**/**").match("a/b/c")).toBeTrue();
      expect(new Glob("*/**").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**/**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**/**/**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**/*").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**/**/*").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**/**/**/*").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/b/**/c/**/*.*").match("a/b/c/d.e")).toBeTrue();
      expect(new Glob("a/**/f/*.md").match("a/b/c/d/e/f/g.md")).toBeTrue();
      expect(new Glob("a/**/f/**/k/*.md").match("a/b/c/d/e/f/g/h/i/j/k/l.md")).toBeTrue();
      expect(new Glob("a/b/c/*.md").match("a/b/c/def.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bb.bb/c/ddd.md")).toBeTrue();
      expect(new Glob("a/**/f/*.md").match("a/bb.bb/cc/d.d/ee/f/ggg.md")).toBeTrue();
      expect(new Glob("a/**/f/*.md").match("a/bb.bb/cc/dd/ee/f/ggg.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bb/c/ddd.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bbbb/c/ddd.md")).toBeTrue();
      expect(new Glob("foo/bar/**/one/**/*.*").match("foo/bar/baz/one/image.png")).toBeTrue();
      expect(new Glob("foo/bar/**/one/**/*.*").match("foo/bar/baz/one/two/image.png")).toBeTrue();
      expect(new Glob("foo/bar/**/one/**/*.*").match("foo/bar/baz/one/two/three/image.png")).toBeTrue();
      expect(new Glob("a/b/**/f").match("a/b/c/d/")).toBeFalse();
      expect(new Glob("**").match("a")).toBeTrue();
      expect(new Glob("**").match("a/")).toBeTrue();
      expect(new Glob("a/**").match("a/")).toBeTrue();
      expect(new Glob("**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("**/**").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("**/b/**").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("a/b/**").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("a/b/**/").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("a/b/**/c/**/").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("a/b/**/c/**/d/").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("a/b/**/**/*.*").match("a/b/c/d/e.f")).toBeTrue();
      expect(new Glob("a/b/**/*.*").match("a/b/c/d/e.f")).toBeTrue();
      expect(new Glob("a/b/**/c/**/d/*.*").match("a/b/c/d/e.f")).toBeTrue();
      expect(new Glob("a/b/**/d/**/*.*").match("a/b/c/d/e.f")).toBeTrue();
      expect(new Glob("a/b/**/d/**/*.*").match("a/b/c/d/g/e.f")).toBeTrue();
      expect(new Glob("a/b/**/d/**/*.*").match("a/b/c/d/g/g/e.f")).toBeTrue();
      expect(new Glob("a/b-*/**/z.js").match("a/b-c/z.js")).toBeTrue();
      expect(new Glob("a/b-*/**/z.js").match("a/b-c/d/e/z.js")).toBeTrue();
      expect(new Glob("*/*").match("a/b")).toBeTrue();
      expect(new Glob("a/b/c/*.md").match("a/b/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bb.bb/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bb/c/xyz.md")).toBeTrue();
      expect(new Glob("a/*/c/*.md").match("a/bbbb/c/xyz.md")).toBeTrue();
      expect(new Glob("**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("**/**").match("a/b/c")).toBeTrue();
      expect(new Glob("*/**").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**/j/**/z/*.md").match("a/b/c/d/e/j/n/p/o/z/c.md")).toBeTrue();
      expect(new Glob("a/**/z/*.md").match("a/b/c/d/e/z/c.md")).toBeTrue();
      expect(new Glob("a/**/c/*.md").match("a/bb.bb/aa/b.b/aa/c/xyz.md")).toBeTrue();
      expect(new Glob("a/**/c/*.md").match("a/bb.bb/aa/bb/aa/c/xyz.md")).toBeTrue();
      expect(new Glob("a/**/j/**/z/*.md").match("a/b/c/j/e/z/c.txt")).toBeFalse();
      expect(new Glob("a/b/**/c{d,e}/**/xyz.md").match("a/b/c/xyz.md")).toBeFalse();
      expect(new Glob("a/b/**/c{d,e}/**/xyz.md").match("a/b/d/xyz.md")).toBeFalse();
      expect(new Glob("a/**/").match("a/b")).toBeFalse();
      expect(new Glob("a/**/").match("a/b/c/d")).toBeFalse();
      expect(new Glob("a/**/").match("a/bb")).toBeFalse();
      expect(new Glob("a/**/").match("a/cb")).toBeFalse();
      expect(new Glob("/**").match("/a/b")).toBeTrue();
      expect(new Glob("**/*").match("a.b")).toBeTrue();
      expect(new Glob("**/*").match("a.js")).toBeTrue();
      expect(new Glob("**/*.js").match("a.js")).toBeTrue();
      expect(new Glob("**/*.js").match("a/a.js")).toBeTrue();
      expect(new Glob("**/*.js").match("a/a/b.js")).toBeTrue();
      expect(new Glob("a/**/b").match("a/b")).toBeTrue();
      expect(new Glob("a/**b").match("a/b")).toBeTrue();
      expect(new Glob("**/*.md").match("a/b.md")).toBeTrue();
      expect(new Glob("**/*").match("a/b/c.js")).toBeTrue();
      expect(new Glob("**/*").match("a/b/c.txt")).toBeTrue();
      expect(new Glob("a/**/").match("a/b/c/d/")).toBeTrue();
      expect(new Glob("**/*").match("a/b/c/d/a.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/b/c/z.js")).toBeTrue();
      expect(new Glob("a/b/**/*.js").match("a/b/z.js")).toBeTrue();
      expect(new Glob("**/*").match("ab")).toBeTrue();
      expect(new Glob("**/*").match("ab/c")).toBeTrue();
      expect(new Glob("**/*").match("ab/c/d")).toBeTrue();
      expect(new Glob("**/*").match("abc.js")).toBeTrue();
      expect(new Glob("**/").match("a")).toBeFalse();
      expect(new Glob("**/a/*").match("a")).toBeFalse();
      expect(new Glob("**/a/*/*").match("a")).toBeFalse();
      expect(new Glob("*/a/**").match("a")).toBeFalse();
      expect(new Glob("a/**/*").match("a")).toBeFalse();
      expect(new Glob("a/**/**/*").match("a")).toBeFalse();
      expect(new Glob("**/").match("a/b")).toBeFalse();
      expect(new Glob("**/b/*").match("a/b")).toBeFalse();
      expect(new Glob("**/b/*/*").match("a/b")).toBeFalse();
      expect(new Glob("b/**").match("a/b")).toBeFalse();
      expect(new Glob("**/").match("a/b/c")).toBeFalse();
      expect(new Glob("**/**/b").match("a/b/c")).toBeFalse();
      expect(new Glob("**/b").match("a/b/c")).toBeFalse();
      expect(new Glob("**/b/*/*").match("a/b/c")).toBeFalse();
      expect(new Glob("b/**").match("a/b/c")).toBeFalse();
      expect(new Glob("**/").match("a/b/c/d")).toBeFalse();
      expect(new Glob("**/d/*").match("a/b/c/d")).toBeFalse();
      expect(new Glob("b/**").match("a/b/c/d")).toBeFalse();
      expect(new Glob("**").match("a")).toBeTrue();
      expect(new Glob("**/**").match("a")).toBeTrue();
      expect(new Glob("**/**/*").match("a")).toBeTrue();
      expect(new Glob("**/**/a").match("a")).toBeTrue();
      expect(new Glob("**/a").match("a")).toBeTrue();
      expect(new Glob("**").match("a/b")).toBeTrue();
      expect(new Glob("**/**").match("a/b")).toBeTrue();
      expect(new Glob("**/**/*").match("a/b")).toBeTrue();
      expect(new Glob("**/**/b").match("a/b")).toBeTrue();
      expect(new Glob("**/b").match("a/b")).toBeTrue();
      expect(new Glob("a/**").match("a/b")).toBeTrue();
      expect(new Glob("a/**/*").match("a/b")).toBeTrue();
      expect(new Glob("a/**/**/*").match("a/b")).toBeTrue();
      expect(new Glob("**").match("a/b/c")).toBeTrue();
      expect(new Glob("**/**").match("a/b/c")).toBeTrue();
      expect(new Glob("**/**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("**/b/*").match("a/b/c")).toBeTrue();
      expect(new Glob("**/b/**").match("a/b/c")).toBeTrue();
      expect(new Glob("*/b/**").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("a/**/**/*").match("a/b/c")).toBeTrue();
      expect(new Glob("**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**/**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**/**/*").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**/**/d").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**/b/**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**/b/*/*").match("a/b/c/d")).toBeTrue();
      expect(new Glob("**/d").match("a/b/c/d")).toBeTrue();
      expect(new Glob("*/b/**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**/*").match("a/b/c/d")).toBeTrue();
      expect(new Glob("a/**/**/*").match("a/b/c/d")).toBeTrue();
    });

    test("utf8", () => {
      expect(new Glob("フ*/**/*").match("フォルダ/aaa.js")).toBeTrue();
      expect(new Glob("フォ*/**/*").match("フォルダ/aaa.js")).toBeTrue();
      expect(new Glob("フォル*/**/*").match("フォルダ/aaa.js")).toBeTrue();
      expect(new Glob("フ*ル*/**/*").match("フォルダ/aaa.js")).toBeTrue();
      expect(new Glob("フォルダ/**/*").match("フォルダ/aaa.js")).toBeTrue();
    });

    test("negation", () => {
      expect(new Glob("!*").match("abc")).toBeFalse();
      expect(new Glob("!abc").match("abc")).toBeFalse();
      expect(new Glob("*!.md").match("bar.md")).toBeFalse();
      expect(new Glob("foo!.md").match("bar.md")).toBeFalse();
      expect(new Glob("\\!*!*.md").match("foo!.md")).toBeFalse();
      expect(new Glob("\\!*!*.md").match("foo!bar.md")).toBeFalse();
      expect(new Glob("*!*.md").match("!foo!.md")).toBeTrue();
      expect(new Glob("\\!*!*.md").match("!foo!.md")).toBeTrue();
      expect(new Glob("!*foo").match("abc")).toBeTrue();
      expect(new Glob("!foo*").match("abc")).toBeTrue();
      expect(new Glob("!xyz").match("abc")).toBeTrue();
      expect(new Glob("*!*.*").match("ba!r.js")).toBeTrue();
      expect(new Glob("*.md").match("bar.md")).toBeTrue();
      expect(new Glob("*!*.*").match("foo!.md")).toBeTrue();
      expect(new Glob("*!*.md").match("foo!.md")).toBeTrue();
      expect(new Glob("*!.md").match("foo!.md")).toBeTrue();
      expect(new Glob("*.md").match("foo!.md")).toBeTrue();
      expect(new Glob("foo!.md").match("foo!.md")).toBeTrue();
      expect(new Glob("*!*.md").match("foo!bar.md")).toBeTrue();
      expect(new Glob("*b*.md").match("foobar.md")).toBeTrue();
      expect(new Glob("a!!b").match("a")).toBeFalse();
      expect(new Glob("a!!b").match("aa")).toBeFalse();
      expect(new Glob("a!!b").match("a/b")).toBeFalse();
      expect(new Glob("a!!b").match("a!b")).toBeFalse();
      expect(new Glob("a!!b").match("a!!b")).toBeTrue();
      expect(new Glob("a!!b").match("a/!!/b")).toBeFalse();
      expect(new Glob("!a/b").match("a/b")).toBeFalse();
      expect(new Glob("!a/b").match("a")).toBeTrue();
      expect(new Glob("!a/b").match("a.b")).toBeTrue();
      expect(new Glob("!a/b").match("a/a")).toBeTrue();
      expect(new Glob("!a/b").match("a/c")).toBeTrue();
      expect(new Glob("!a/b").match("b/a")).toBeTrue();
      expect(new Glob("!a/b").match("b/b")).toBeTrue();
      expect(new Glob("!a/b").match("b/c")).toBeTrue();
      expect(new Glob("!abc").match("abc")).toBeFalse();
      expect(new Glob("!!abc").match("abc")).toBeTrue();
      expect(new Glob("!!!abc").match("abc")).toBeFalse();
      expect(new Glob("!!!!abc").match("abc")).toBeTrue();
      expect(new Glob("!!!!!abc").match("abc")).toBeFalse();
      expect(new Glob("!!!!!!abc").match("abc")).toBeTrue();
      expect(new Glob("!!!!!!!abc").match("abc")).toBeFalse();
      expect(new Glob("!!!!!!!!abc").match("abc")).toBeTrue();
      // try expect(!match("!(*/*)", "a/a"));
      // try expect(!match("!(*/*)", "a/b"));
      // try expect(!match("!(*/*)", "a/c"));
      // try expect(!match("!(*/*)", "b/a"));
      // try expect(!match("!(*/*)", "b/b"));
      // try expect(!match("!(*/*)", "b/c"));
      // try expect(!match("!(*/b)", "a/b"));
      // try expect(!match("!(*/b)", "b/b"));
      // try expect(!match("!(a/b)", "a/b"));
      expect(new Glob("!*").match("a")).toBeFalse();
      expect(new Glob("!*").match("a.b")).toBeFalse();
      expect(new Glob("!*/*").match("a/a")).toBeFalse();
      expect(new Glob("!*/*").match("a/b")).toBeFalse();
      expect(new Glob("!*/*").match("a/c")).toBeFalse();
      expect(new Glob("!*/*").match("b/a")).toBeFalse();
      expect(new Glob("!*/*").match("b/b")).toBeFalse();
      expect(new Glob("!*/*").match("b/c")).toBeFalse();
      expect(new Glob("!*/b").match("a/b")).toBeFalse();
      expect(new Glob("!*/b").match("b/b")).toBeFalse();
      expect(new Glob("!*/c").match("a/c")).toBeFalse();
      expect(new Glob("!*/c").match("a/c")).toBeFalse();
      expect(new Glob("!*/c").match("b/c")).toBeFalse();
      expect(new Glob("!*/c").match("b/c")).toBeFalse();
      expect(new Glob("!*a*").match("bar")).toBeFalse();
      expect(new Glob("!*a*").match("fab")).toBeFalse();
      // try expect(!match("!a/(*)", "a/a"));
      // try expect(!match("!a/(*)", "a/b"));
      // try expect(!match("!a/(*)", "a/c"));
      // try expect(!match("!a/(b)", "a/b"));
      expect(new Glob("!a/*").match("a/a")).toBeFalse();
      expect(new Glob("!a/*").match("a/b")).toBeFalse();
      expect(new Glob("!a/*").match("a/c")).toBeFalse();
      expect(new Glob("!f*b").match("fab")).toBeFalse();
      // try expect(match("!(*/*)", "a"));
      // try expect(match("!(*/*)", "a.b"));
      // try expect(match("!(*/b)", "a"));
      // try expect(match("!(*/b)", "a.b"));
      // try expect(match("!(*/b)", "a/a"));
      // try expect(match("!(*/b)", "a/c"));
      // try expect(match("!(*/b)", "b/a"));
      // try expect(match("!(*/b)", "b/c"));
      // try expect(match("!(a/b)", "a"));
      // try expect(match("!(a/b)", "a.b"));
      // try expect(match("!(a/b)", "a/a"));
      // try expect(match("!(a/b)", "a/c"));
      // try expect(match("!(a/b)", "b/a"));
      // try expect(match("!(a/b)", "b/b"));
      // try expect(match("!(a/b)", "b/c"));
      expect(new Glob("!*").match("a/a")).toBeTrue();
      expect(new Glob("!*").match("a/b")).toBeTrue();
      expect(new Glob("!*").match("a/c")).toBeTrue();
      expect(new Glob("!*").match("b/a")).toBeTrue();
      expect(new Glob("!*").match("b/b")).toBeTrue();
      expect(new Glob("!*").match("b/c")).toBeTrue();
      expect(new Glob("!*/*").match("a")).toBeTrue();
      expect(new Glob("!*/*").match("a.b")).toBeTrue();
      expect(new Glob("!*/b").match("a")).toBeTrue();
      expect(new Glob("!*/b").match("a.b")).toBeTrue();
      expect(new Glob("!*/b").match("a/a")).toBeTrue();
      expect(new Glob("!*/b").match("a/c")).toBeTrue();
      expect(new Glob("!*/b").match("b/a")).toBeTrue();
      expect(new Glob("!*/b").match("b/c")).toBeTrue();
      expect(new Glob("!*/c").match("a")).toBeTrue();
      expect(new Glob("!*/c").match("a.b")).toBeTrue();
      expect(new Glob("!*/c").match("a/a")).toBeTrue();
      expect(new Glob("!*/c").match("a/b")).toBeTrue();
      expect(new Glob("!*/c").match("b/a")).toBeTrue();
      expect(new Glob("!*/c").match("b/b")).toBeTrue();
      expect(new Glob("!*a*").match("foo")).toBeTrue();
      // try expect(match("!a/(*)", "a"));
      // try expect(match("!a/(*)", "a.b"));
      // try expect(match("!a/(*)", "b/a"));
      // try expect(match("!a/(*)", "b/b"));
      // try expect(match("!a/(*)", "b/c"));
      // try expect(match("!a/(b)", "a"));
      // try expect(match("!a/(b)", "a.b"));
      // try expect(match("!a/(b)", "a/a"));
      // try expect(match("!a/(b)", "a/c"));
      // try expect(match("!a/(b)", "b/a"));
      // try expect(match("!a/(b)", "b/b"));
      // try expect(match("!a/(b)", "b/c"));
      expect(new Glob("!a/*").match("a")).toBeTrue();
      expect(new Glob("!a/*").match("a.b")).toBeTrue();
      expect(new Glob("!a/*").match("b/a")).toBeTrue();
      expect(new Glob("!a/*").match("b/b")).toBeTrue();
      expect(new Glob("!a/*").match("b/c")).toBeTrue();
      expect(new Glob("!f*b").match("bar")).toBeTrue();
      expect(new Glob("!f*b").match("foo")).toBeTrue();
      expect(new Glob("!.md").match(".md")).toBeFalse();
      expect(new Glob("!**/*.md").match("a.js")).toBeTrue();
      // try expect(!match("!**/*.md", "b.md"));
      expect(new Glob("!**/*.md").match("c.txt")).toBeTrue();
      expect(new Glob("!*.md").match("a.js")).toBeTrue();
      expect(new Glob("!*.md").match("b.md")).toBeFalse();
      expect(new Glob("!*.md").match("c.txt")).toBeTrue();
      expect(new Glob("!*.md").match("abc.md")).toBeFalse();
      expect(new Glob("!*.md").match("abc.txt")).toBeTrue();
      expect(new Glob("!*.md").match("foo.md")).toBeFalse();
      expect(new Glob("!.md").match("foo.md")).toBeTrue();
      expect(new Glob("!*.md").match("a.js")).toBeTrue();
      expect(new Glob("!*.md").match("b.txt")).toBeTrue();
      expect(new Glob("!*.md").match("c.md")).toBeFalse();
      expect(new Glob("!a/*/a.js").match("a/a/a.js")).toBeFalse();
      expect(new Glob("!a/*/a.js").match("a/b/a.js")).toBeFalse();
      expect(new Glob("!a/*/a.js").match("a/c/a.js")).toBeFalse();
      expect(new Glob("!a/*/*/a.js").match("a/a/a/a.js")).toBeFalse();
      expect(new Glob("!a/*/*/a.js").match("b/a/b/a.js")).toBeTrue();
      expect(new Glob("!a/*/*/a.js").match("c/a/c/a.js")).toBeTrue();
      expect(new Glob("!a/a*.txt").match("a/a.txt")).toBeFalse();
      expect(new Glob("!a/a*.txt").match("a/b.txt")).toBeTrue();
      expect(new Glob("!a/a*.txt").match("a/c.txt")).toBeTrue();
      expect(new Glob("!a.a*.txt").match("a.a.txt")).toBeFalse();
      expect(new Glob("!a.a*.txt").match("a.b.txt")).toBeTrue();
      expect(new Glob("!a.a*.txt").match("a.c.txt")).toBeTrue();
      expect(new Glob("!a/*.txt").match("a/a.txt")).toBeFalse();
      expect(new Glob("!a/*.txt").match("a/b.txt")).toBeFalse();
      expect(new Glob("!a/*.txt").match("a/c.txt")).toBeFalse();
      expect(new Glob("!*.md").match("a.js")).toBeTrue();
      expect(new Glob("!*.md").match("b.txt")).toBeTrue();
      expect(new Glob("!*.md").match("c.md")).toBeFalse();
      // try expect(!match("!**/a.js", "a/a/a.js"));
      // try expect(!match("!**/a.js", "a/b/a.js"));
      // try expect(!match("!**/a.js", "a/c/a.js"));
      expect(new Glob("!**/a.js").match("a/a/b.js")).toBeTrue();
      expect(new Glob("!a/**/a.js").match("a/a/a/a.js")).toBeFalse();
      expect(new Glob("!a/**/a.js").match("b/a/b/a.js")).toBeTrue();
      expect(new Glob("!a/**/a.js").match("c/a/c/a.js")).toBeTrue();
      expect(new Glob("!**/*.md").match("a/b.js")).toBeTrue();
      expect(new Glob("!**/*.md").match("a.js")).toBeTrue();
      expect(new Glob("!**/*.md").match("a/b.md")).toBeFalse();
      // try expect(!match("!**/*.md", "a.md"));
      expect(new Glob("**/*.md").match("a/b.js")).toBeFalse();
      expect(new Glob("**/*.md").match("a.js")).toBeFalse();
      expect(new Glob("**/*.md").match("a/b.md")).toBeTrue();
      expect(new Glob("**/*.md").match("a.md")).toBeTrue();
      expect(new Glob("!**/*.md").match("a/b.js")).toBeTrue();
      expect(new Glob("!**/*.md").match("a.js")).toBeTrue();
      expect(new Glob("!**/*.md").match("a/b.md")).toBeFalse();
      // try expect(!match("!**/*.md", "a.md"));
      expect(new Glob("!*.md").match("a/b.js")).toBeTrue();
      expect(new Glob("!*.md").match("a.js")).toBeTrue();
      expect(new Glob("!*.md").match("a/b.md")).toBeTrue();
      expect(new Glob("!*.md").match("a.md")).toBeFalse();
      expect(new Glob("!**/*.md").match("a.js")).toBeTrue();
      // try expect(!match("!**/*.md", "b.md"));
      expect(new Glob("!**/*.md").match("c.txt")).toBeTrue();
    });

    test("question_mark", () => {
      expect(new Glob("?").match("a")).toBeTrue();
      expect(new Glob("?").match("aa")).toBeFalse();
      expect(new Glob("?").match("ab")).toBeFalse();
      expect(new Glob("?").match("aaa")).toBeFalse();
      expect(new Glob("?").match("abcdefg")).toBeFalse();
      expect(new Glob("??").match("a")).toBeFalse();
      expect(new Glob("??").match("aa")).toBeTrue();
      expect(new Glob("??").match("ab")).toBeTrue();
      expect(new Glob("??").match("aaa")).toBeFalse();
      expect(new Glob("??").match("abcdefg")).toBeFalse();
      expect(new Glob("???").match("a")).toBeFalse();
      expect(new Glob("???").match("aa")).toBeFalse();
      expect(new Glob("???").match("ab")).toBeFalse();
      expect(new Glob("???").match("aaa")).toBeTrue();
      expect(new Glob("???").match("abcdefg")).toBeFalse();
      expect(new Glob("a?c").match("aaa")).toBeFalse();
      expect(new Glob("a?c").match("aac")).toBeTrue();
      expect(new Glob("a?c").match("abc")).toBeTrue();
      expect(new Glob("ab?").match("a")).toBeFalse();
      expect(new Glob("ab?").match("aa")).toBeFalse();
      expect(new Glob("ab?").match("ab")).toBeFalse();
      expect(new Glob("ab?").match("ac")).toBeFalse();
      expect(new Glob("ab?").match("abcd")).toBeFalse();
      expect(new Glob("ab?").match("abbb")).toBeFalse();
      expect(new Glob("a?b").match("acb")).toBeTrue();
      expect(new Glob("a/?/c/?/e.md").match("a/bb/c/dd/e.md")).toBeFalse();
      expect(new Glob("a/??/c/??/e.md").match("a/bb/c/dd/e.md")).toBeTrue();
      expect(new Glob("a/??/c.md").match("a/bbb/c.md")).toBeFalse();
      expect(new Glob("a/?/c.md").match("a/b/c.md")).toBeTrue();
      expect(new Glob("a/?/c/?/e.md").match("a/b/c/d/e.md")).toBeTrue();
      expect(new Glob("a/?/c/???/e.md").match("a/b/c/d/e.md")).toBeFalse();
      expect(new Glob("a/?/c/???/e.md").match("a/b/c/zzz/e.md")).toBeTrue();
      expect(new Glob("a/?/c.md").match("a/bb/c.md")).toBeFalse();
      expect(new Glob("a/??/c.md").match("a/bb/c.md")).toBeTrue();
      expect(new Glob("a/???/c.md").match("a/bbb/c.md")).toBeTrue();
      expect(new Glob("a/????/c.md").match("a/bbbb/c.md")).toBeTrue();
    });

    test("braces", () => {
      expect(new Glob("{a,b,c}").match("a")).toBeTrue();
      expect(new Glob("{a,b,c}").match("b")).toBeTrue();
      expect(new Glob("{a,b,c}").match("c")).toBeTrue();
      expect(new Glob("{a,b,c}").match("aa")).toBeFalse();
      expect(new Glob("{a,b,c}").match("bb")).toBeFalse();
      expect(new Glob("{a,b,c}").match("cc")).toBeFalse();
      expect(new Glob("a/{a,b}").match("a/a")).toBeTrue();
      expect(new Glob("a/{a,b}").match("a/b")).toBeTrue();
      expect(new Glob("a/{a,b}").match("a/c")).toBeFalse();
      expect(new Glob("a/{a,b}").match("b/b")).toBeFalse();
      expect(new Glob("a/{a,b,c}").match("b/b")).toBeFalse();
      expect(new Glob("a/{a,b,c}").match("a/c")).toBeTrue();
      expect(new Glob("a{b,bc}.txt").match("abc.txt")).toBeTrue();
      expect(new Glob("foo[{a,b}]baz").match("foo{baz")).toBeTrue();
      expect(new Glob("a{,b}.txt").match("abc.txt")).toBeFalse();
      expect(new Glob("a{a,b,}.txt").match("abc.txt")).toBeFalse();
      expect(new Glob("a{b,}.txt").match("abc.txt")).toBeFalse();
      expect(new Glob("a{,b}.txt").match("a.txt")).toBeTrue();
      expect(new Glob("a{b,}.txt").match("a.txt")).toBeTrue();
      expect(new Glob("a{a,b,}.txt").match("aa.txt")).toBeTrue();
      expect(new Glob("a{a,b,}.txt").match("aa.txt")).toBeTrue();
      expect(new Glob("a{,b}.txt").match("ab.txt")).toBeTrue();
      expect(new Glob("a{b,}.txt").match("ab.txt")).toBeTrue();
      // try expect(match("{a/,}a/**", "a"));
      expect(new Glob("a{a,b/}*.txt").match("aa.txt")).toBeTrue();
      expect(new Glob("a{a,b/}*.txt").match("ab/.txt")).toBeTrue();
      expect(new Glob("a{a,b/}*.txt").match("ab/a.txt")).toBeTrue();
      // try expect(match("{a/,}a/**", "a/"));
      expect(new Glob("{a/,}a/**").match("a/a/")).toBeTrue();
      // try expect(match("{a/,}a/**", "a/a"));
      expect(new Glob("{a/,}a/**").match("a/a/a")).toBeTrue();
      expect(new Glob("{a/,}a/**").match("a/a/")).toBeTrue();
      expect(new Glob("{a/,}a/**").match("a/a/a/")).toBeTrue();
      expect(new Glob("{a/,}b/**").match("a/b/a/")).toBeTrue();
      expect(new Glob("{a/,}b/**").match("b/a/")).toBeTrue();
      expect(new Glob("a{,/}*.txt").match("a.txt")).toBeTrue();
      expect(new Glob("a{,/}*.txt").match("ab.txt")).toBeTrue();
      expect(new Glob("a{,/}*.txt").match("a/b.txt")).toBeTrue();
      expect(new Glob("a{,/}*.txt").match("a/ab.txt")).toBeTrue();
      expect(new Glob("a{,.*{foo,db},\\(bar\\)}.txt").match("a.txt")).toBeTrue();
      expect(new Glob("a{,.*{foo,db},\\(bar\\)}.txt").match("adb.txt")).toBeFalse();
      expect(new Glob("a{,.*{foo,db},\\(bar\\)}.txt").match("a.db.txt")).toBeTrue();
      expect(new Glob("a{,*.{foo,db},\\(bar\\)}.txt").match("a.txt")).toBeTrue();
      expect(new Glob("a{,*.{foo,db},\\(bar\\)}.txt").match("adb.txt")).toBeFalse();
      expect(new Glob("a{,*.{foo,db},\\(bar\\)}.txt").match("a.db.txt")).toBeTrue();
      // try expect(match("a{,.*{foo,db},\\(bar\\)}", "a"));
      expect(new Glob("a{,.*{foo,db},\\(bar\\)}").match("adb")).toBeFalse();
      expect(new Glob("a{,.*{foo,db},\\(bar\\)}").match("a.db")).toBeTrue();
      // try expect(match("a{,*.{foo,db},\\(bar\\)}", "a"));
      expect(new Glob("a{,*.{foo,db},\\(bar\\)}").match("adb")).toBeFalse();
      expect(new Glob("a{,*.{foo,db},\\(bar\\)}").match("a.db")).toBeTrue();
      expect(new Glob("{,.*{foo,db},\\(bar\\)}").match("a")).toBeFalse();
      expect(new Glob("{,.*{foo,db},\\(bar\\)}").match("adb")).toBeFalse();
      expect(new Glob("{,.*{foo,db},\\(bar\\)}").match("a.db")).toBeFalse();
      expect(new Glob("{,.*{foo,db},\\(bar\\)}").match(".db")).toBeTrue();
      expect(new Glob("{,*.{foo,db},\\(bar\\)}").match("a")).toBeFalse();
      expect(new Glob("{*,*.{foo,db},\\(bar\\)}").match("a")).toBeTrue();
      expect(new Glob("{,*.{foo,db},\\(bar\\)}").match("adb")).toBeFalse();
      expect(new Glob("{,*.{foo,db},\\(bar\\)}").match("a.db")).toBeTrue();
      expect(new Glob("a/b/**/c{d,e}/**/xyz.md").match("a/b/c/xyz.md")).toBeFalse();
      expect(new Glob("a/b/**/c{d,e}/**/xyz.md").match("a/b/d/xyz.md")).toBeFalse();
      expect(new Glob("a/b/**/c{d,e}/**/xyz.md").match("a/b/cd/xyz.md")).toBeTrue();
      expect(new Glob("a/b/**/{c,d,e}/**/xyz.md").match("a/b/c/xyz.md")).toBeTrue();
      expect(new Glob("a/b/**/{c,d,e}/**/xyz.md").match("a/b/d/xyz.md")).toBeTrue();
      expect(new Glob("a/b/**/{c,d,e}/**/xyz.md").match("a/b/e/xyz.md")).toBeTrue();
      expect(new Glob("*{a,b}*").match("xax")).toBeTrue();
      expect(new Glob("*{a,b}*").match("xxax")).toBeTrue();
      expect(new Glob("*{a,b}*").match("xbx")).toBeTrue();
      expect(new Glob("*{*a,b}").match("xba")).toBeTrue();
      expect(new Glob("*{*a,b}").match("xb")).toBeTrue();
      expect(new Glob("*??").match("a")).toBeFalse();
      expect(new Glob("*???").match("aa")).toBeFalse();
      expect(new Glob("*???").match("aaa")).toBeTrue();
      expect(new Glob("*****??").match("a")).toBeFalse();
      expect(new Glob("*****???").match("aa")).toBeFalse();
      expect(new Glob("*****???").match("aaa")).toBeTrue();
      expect(new Glob("a*?c").match("aaa")).toBeFalse();
      expect(new Glob("a*?c").match("aac")).toBeTrue();
      expect(new Glob("a*?c").match("abc")).toBeTrue();
      expect(new Glob("a**?c").match("abc")).toBeTrue();
      expect(new Glob("a**?c").match("abb")).toBeFalse();
      expect(new Glob("a**?c").match("acc")).toBeTrue();
      expect(new Glob("a*****?c").match("abc")).toBeTrue();
      expect(new Glob("*****?").match("a")).toBeTrue();
      expect(new Glob("*****?").match("aa")).toBeTrue();
      expect(new Glob("*****?").match("abc")).toBeTrue();
      expect(new Glob("*****?").match("zzz")).toBeTrue();
      expect(new Glob("*****?").match("bbb")).toBeTrue();
      expect(new Glob("*****?").match("aaaa")).toBeTrue();
      expect(new Glob("*****??").match("a")).toBeFalse();
      expect(new Glob("*****??").match("aa")).toBeTrue();
      expect(new Glob("*****??").match("abc")).toBeTrue();
      expect(new Glob("*****??").match("zzz")).toBeTrue();
      expect(new Glob("*****??").match("bbb")).toBeTrue();
      expect(new Glob("*****??").match("aaaa")).toBeTrue();
      expect(new Glob("?*****??").match("a")).toBeFalse();
      expect(new Glob("?*****??").match("aa")).toBeFalse();
      expect(new Glob("?*****??").match("abc")).toBeTrue();
      expect(new Glob("?*****??").match("zzz")).toBeTrue();
      expect(new Glob("?*****??").match("bbb")).toBeTrue();
      expect(new Glob("?*****??").match("aaaa")).toBeTrue();
      expect(new Glob("?*****?c").match("abc")).toBeTrue();
      expect(new Glob("?*****?c").match("abb")).toBeFalse();
      expect(new Glob("?*****?c").match("zzz")).toBeFalse();
      expect(new Glob("?***?****c").match("abc")).toBeTrue();
      expect(new Glob("?***?****c").match("bbb")).toBeFalse();
      expect(new Glob("?***?****c").match("zzz")).toBeFalse();
      expect(new Glob("?***?****?").match("abc")).toBeTrue();
      expect(new Glob("?***?****?").match("bbb")).toBeTrue();
      expect(new Glob("?***?****?").match("zzz")).toBeTrue();
      expect(new Glob("?***?****").match("abc")).toBeTrue();
      expect(new Glob("*******c").match("abc")).toBeTrue();
      expect(new Glob("*******?").match("abc")).toBeTrue();
      expect(new Glob("a*cd**?**??k").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??k").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??k***").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??***k").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a**?**cd**?**??***k**").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a****c**?**??*****").match("abcdecdhjk")).toBeTrue();
      expect(new Glob("a/?/c/?/*/e.md").match("a/b/c/d/e.md")).toBeFalse();
      expect(new Glob("a/?/c/?/*/e.md").match("a/b/c/d/e/e.md")).toBeTrue();
      expect(new Glob("a/?/c/?/*/e.md").match("a/b/c/d/efghijk/e.md")).toBeTrue();
      expect(new Glob("a/?/**/e.md").match("a/b/c/d/efghijk/e.md")).toBeTrue();
      expect(new Glob("a/?/e.md").match("a/bb/e.md")).toBeFalse();
      expect(new Glob("a/??/e.md").match("a/bb/e.md")).toBeTrue();
      expect(new Glob("a/?/**/e.md").match("a/bb/e.md")).toBeFalse();
      expect(new Glob("a/?/**/e.md").match("a/b/ccc/e.md")).toBeTrue();
      expect(new Glob("a/*/?/**/e.md").match("a/b/c/d/efghijk/e.md")).toBeTrue();
      expect(new Glob("a/*/?/**/e.md").match("a/b/c/d/efgh.ijk/e.md")).toBeTrue();
      expect(new Glob("a/*/?/**/e.md").match("a/b.bb/c/d/efgh.ijk/e.md")).toBeTrue();
      expect(new Glob("a/*/?/**/e.md").match("a/bbb/c/d/efgh.ijk/e.md")).toBeTrue();
      expect(new Glob("a/*/ab??.md").match("a/bbb/abcd.md")).toBeTrue();
      expect(new Glob("a/bbb/ab??.md").match("a/bbb/abcd.md")).toBeTrue();
      expect(new Glob("a/bbb/ab???md").match("a/bbb/abcd.md")).toBeTrue();
    });
  });

  test("invalid input", () => {
    const glob = new Glob("nice");

    expect(
      returnError(() =>
        glob.match(
          // @ts-expect-error
          null,
        ),
      ),
    ).toBeDefined();
    expect(
      returnError(() =>
        glob.match(
          // @ts-expect-error
          true,
        ),
      ),
    ).toBeDefined();

    expect(
      returnError(() =>
        glob.match(
          // @ts-expect-error
          {},
        ),
      ),
    ).toBeDefined();
  });

  test("trailing globstar patterns", () => {
    let glob = new Glob("C:/Users/window/AppData/Local/Temp/testworkspace_V7osKW**");
    expect(glob.match("C:/Users/window/AppData/Local/Temp/testworkspace_V7osKW/packages/malfored1")).toBeFalse();

    // Trailing globstar with no slash won't match subdirectories
    // expect(new Glob("foo**").match("foo/bar/hi")).toBeFalse();
    expect(new Glob("foo**").match("foobar")).toBeTrue();
    expect(new Glob("foo**").match("foo")).toBeTrue();

    // Basic trailing globstar
    expect(new Glob("foo/**").match("foo")).toBeFalse();
    expect(new Glob("foo/**").match("foo/")).toBeTrue();
    expect(new Glob("foo/**").match("foo/bar")).toBeTrue();
    expect(new Glob("foo/**").match("foo/bar/baz")).toBeTrue();
    expect(new Glob("foo/**").match("foo/bar/baz/")).toBeTrue();
    expect(new Glob("foo/**").match("food/bar")).toBeFalse();

    // Multiple trailing globstars (should behave the same as one)
    expect(new Glob("foo/**/**").match("foo")).toBeFalse();
    expect(new Glob("foo/**/**").match("foo/")).toBeTrue();
    expect(new Glob("foo/**/**").match("foo/bar")).toBeTrue();
    expect(new Glob("foo/**/**").match("foo/bar/baz")).toBeTrue();
    expect(new Glob("foo/**/**/**").match("foo/bar/baz")).toBeTrue();

    // Trailing globstar with file extension
    expect(new Glob("foo/**/*.js").match("foo/bar.js")).toBeTrue();
    expect(new Glob("foo/**/*.js").match("foo/bar/baz.js")).toBeTrue();
    expect(new Glob("foo/**/*.js").match("foo/bar/baz/qux.js")).toBeTrue();
    expect(new Glob("foo/**/*.js").match("foo/bar.txt")).toBeFalse();
    expect(new Glob("foo/**/*.js").match("foo/bar/baz.txt")).toBeFalse();

    // Complex patterns with trailing globstars
    expect(new Glob("**/foo/**").match("foo/")).toBeTrue();
    expect(new Glob("**/foo/**").match("a/foo/")).toBeTrue();
    expect(new Glob("**/foo/**").match("a/b/foo/")).toBeTrue();
    expect(new Glob("**/foo/**").match("foo/bar")).toBeTrue();
    expect(new Glob("**/foo/**").match("a/foo/bar")).toBeTrue();
    expect(new Glob("**/foo/**").match("a/b/foo/bar/baz")).toBeTrue();

    // Edge cases
    expect(new Glob("/**").match("/")).toBeTrue();
    expect(new Glob("/**").match("/foo")).toBeTrue();
    expect(new Glob("/**").match("/foo/bar")).toBeTrue();

    // Empty segments
    expect(new Glob("foo///**").match("foo///bar")).toBeTrue();
    expect(new Glob("foo///**").match("foo/bar")).toBeFalse();

    // Dots and special characters
    expect(new Glob("./**").match(".")).toBeFalse();
    expect(new Glob("./**").match("./")).toBeTrue();
    expect(new Glob("./**").match("./foo")).toBeTrue();
    expect(new Glob("./**").match("./foo/bar")).toBeTrue();
    expect(new Glob("./**").match("../foo")).toBeFalse();

    // Unicode characters
    expect(new Glob("🎉/**").match("🎉/")).toBeTrue();
    expect(new Glob("🎉/**").match("🎉/🌟")).toBeTrue();
    expect(new Glob("🎉/**").match("🎉/🌟/✨")).toBeTrue();

    // Mixing with other glob features
    expect(new Glob("foo/{bar,baz}/**").match("foo/bar/")).toBeTrue();
    expect(new Glob("foo/{bar,baz}/**").match("foo/baz/qux")).toBeTrue();
    expect(new Glob("foo/{bar,baz}/**").match("foo/qux/")).toBeFalse();

    expect(new Glob("foo/[a-z]/**").match("foo/a/")).toBeTrue();
    expect(new Glob("foo/[a-z]/**").match("foo/z/bar")).toBeTrue();
    expect(new Glob("foo/[a-z]/**").match("foo/1/")).toBeFalse();

    // Escaped characters
    expect(new Glob("foo\\*/**").match("foo*/")).toBeTrue();
    expect(new Glob("foo\\*/**").match("foo*/bar")).toBeTrue();
    expect(new Glob("foo\\*/**").match("foobar/")).toBeFalse();

    // Very long paths
    const longPath = "a/".repeat(100);
    expect(new Glob("a/**").match(longPath)).toBeTrue();

    // Mixed case
    expect(new Glob("FoO/**").match("FoO/BaR")).toBeTrue();
    expect(new Glob("FoO/**").match("foo/bar")).toBeFalse();

    // Partial segment matches should fail
    expect(new Glob("foo/**").match("foobar/")).toBeFalse();
    expect(new Glob("foo/**").match("foobar/baz")).toBeFalse();

    // Missing slashes
    expect(new Glob("foo**").match("foo/bar")).toBeFalse();
    expect(new Glob("foo**").match("foobar")).toBeTrue();
    if (isWindows) {
      expect(new Glob("foo/**").match("foo\\bar")).toBeTrue();
    } else {
      expect(new Glob("foo/**").match("foo\\bar")).toBeFalse();
    }

    // Path traversal
    expect(new Glob("foo/**").match("foo/../bar")).toBeTrue();
    expect(new Glob("foo/**").match("foo/bar/../../baz")).toBeTrue();
    expect(new Glob("foo/**").match("foo/bar/../..")).toBeTrue();

    // Empty path segments
    expect(new Glob("foo/**//").match("foo///bar")).toBeFalse();
    expect(new Glob("foo/**").match("foo//bar")).toBeTrue();
    expect(new Glob("a/**/").match("a/b//")).toBeTrue();
    expect(new Glob("foo/**/").match("foo/bar//")).toBeTrue();

    // Unicode normalization
    expect(new Glob("foo/**").match("foo/\u0041\u030A")).toBeTrue(); // "A" with ring
    expect(new Glob("foo/**").match("foo/\u00C5")).toBeTrue(); // "Å" single character
  });
});

function returnError(cb: () => any): Error | undefined {
  try {
    cb();
  } catch (err) {
    // @ts-expect-error
    return err;
  }
  return undefined;
}
