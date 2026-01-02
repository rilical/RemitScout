export interface IPublisherRepository {
  getContributorCount(corridorId: string): Promise<number>
}
