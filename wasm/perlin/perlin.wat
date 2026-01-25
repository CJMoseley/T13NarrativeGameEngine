(module
  ;; Minimal 12D noise-like function in WebAssembly Text (WAT).
  ;; gives error when compiling wast:32:5: error: type mismatch in f64.add, expected [f64, f64] but got [i64, f64] f64.add
  ;; needs fixing
  ;; Export: (func (param f64 x12) (result f64)) named "calculate12DNoise"
  (func $calculate12DNoise (export "calculate12DNoise")
    (param $x0 f64) (param $x1 f64) (param $x2 f64) (param $x3 f64)
    (param $x4 f64) (param $x5 f64) (param $x6 f64) (param $x7 f64)
    (param $x8 f64) (param $x9 f64) (param $x10 f64) (param $x11 f64)
    (result f64)
    (local $hash i64)
    (local $sum f64)

    ;; init
    i64.const 1469598103934665603  ;; FNV offset basis
    local.set $hash
    f64.const 0.0
    local.set $sum

    ;; Unrolled processing for 12 params: mix integer floors into hash, accumulate fractional sum
    local.get $hash
    local.get $x0
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    ;; sum += frac(x0)
    local.get $sum
    local.get $x0
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x1
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x1
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x2
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x2
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x3
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x3
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x4
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x4
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x5
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x5
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x6
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x6
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x7
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x7
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x8
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x8
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x9
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x9
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x10
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.tee $hash
    local.get $sum
    local.get $x10
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    local.get $hash
    local.get $x11
    f64.floor
    i64.trunc_f64_s
    i64.const 1099511628211
    i64.mul
    i64.add
    local.set $hash
    local.get $sum
    local.get $x11
    f64.floor
    f64.sub
    f64.add
    local.set $sum

    ;; Simple mix of hash: xor with shifted
    local.get $hash
    local.get $hash
    i64.const 33
    i64.shr_u
    i64.xor
    local.set $hash

    ;; Convert hash to f64 in approx range [-1,1]
    local.get $hash
    f64.convert_i64_s
    f64.const 9223372036854775808.0 ;; 2^63
    f64.div

    ;; compute avg fractional part: sum / 12.0
    local.get $sum
    f64.const 12.0
    f64.div

    ;; subtract 0.5 to center around 0
    f64.const 0.5
    f64.sub

    ;; multiply hashed value by centered average fraction
    f64.mul

  )
)
