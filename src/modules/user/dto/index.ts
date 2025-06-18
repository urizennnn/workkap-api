import * as v from 'valibot';

export const SignUpWithEmailAndPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
  fullName: v.pipe(v.string(), v.minLength(1)),
  username: v.pipe(v.string(), v.minLength(1)),
  country: v.pipe(v.string(), v.minLength(1)),
});

export type SignUpWithEmailAndPassword = v.InferInput<
  typeof SignUpWithEmailAndPasswordSchema
>;

export const LoginWithEmailAndPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
});
export type LoginWithEmailAndPassword = v.InferInput<
  typeof LoginWithEmailAndPasswordSchema
>;
