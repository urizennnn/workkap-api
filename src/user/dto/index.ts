import * as v from 'valibot';

export const SignUpWithEmailAndPassword = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
  fullName: v.pipe(v.string(), v.minLength(1)),
  username: v.pipe(v.string(), v.minLength(1)),
  country: v.pipe(v.string(), v.minLength(1)),
});

export type SignUpWithEmailAndPassword = v.InferInput<
  typeof SignUpWithEmailAndPassword
>;

export const LoginWithEmailAndPassword = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
});
export type LoginWithEmailAndPassword = v.InferInput<
  typeof LoginWithEmailAndPassword
>;
