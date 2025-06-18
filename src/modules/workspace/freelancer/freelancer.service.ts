import { Injectable } from '@nestjs/common';

@Injectable()
export class FreelancerService {
  getFreelancerData() {
    return { message: 'freelancer workspace' };
  }
}
