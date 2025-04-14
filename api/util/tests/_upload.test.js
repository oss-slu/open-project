import { describe, expect, it } from "vitest";
import { prisma } from "#prisma";

describe("/upload", () => {
  it('should create a job item for job.fileupload scope', async () => {
    const mockData = {
      metadata: {
        jobId: '1',
        shopId: 'shop1',
        userId: 'user1',
        scope: 'job.fileupload',
        resourceId: null,
        materialId: null,
        groupId: null,
      },
      file: {
        key: 'file-key',
        name: 'test.stl',
        url: 'http://example.com/test.stl',
      },
    };

    prisma.job.findFirst.mockResolvedValue({ id: '1', shopId: 'shop1' });
    prisma.jobItem.create.mockResolvedValue({ id: 'jobItem1' });
    prisma.logs.create.mockResolvedValue({});

    await handleUpload(mockData);

    expect(prisma.job.findFirst).toHaveBeenCalledWith({
      where: { id: '1', shopId: 'shop1' },
    });
    expect(prisma.jobItem.create).toHaveBeenCalled();
    expect(prisma.logs.create).toHaveBeenCalled();
  });
});
