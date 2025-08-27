import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import * as v from 'valibot';

export class UpdateFreelancerProfileDto {
  @ApiProperty({
    description: 'A list of the freelancer skills',
    example: ['react', 'node', 'typescript'],
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];
  @ApiProperty({
    description: 'The URL of the freelancer profile picture',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  profilePictureUrl: string;
  @ApiProperty({
    description: 'A list of the freelancer certifications',
    example: ['AWS Certified Cloud Practitioner'],
  })
  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @ApiProperty({
    description: 'A list of the freelancer education',
    example: ['B.Sc. Computer Science'],
  })
  @IsArray()
  @IsString({ each: true })
  education: string[];
}

export const UpdateFreelancerProfileSchema = v.object({
  skills: v.array(v.string()),
  certifications: v.array(v.string()),
  education: v.array(v.string()),
});
