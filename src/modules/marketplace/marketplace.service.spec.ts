import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeviceStatus, LockStatus } from '@prisma/client';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prisma: PrismaService;
  let queue: any;

  const mockPrismaService = {
    supplier: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    device: {
      findMany: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('marketplace'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get(getQueueToken('marketplace'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    const createSupplierDto = {
      name: 'Test Supplier',
      contact: '1234567890',
      email: 'test@supplier.com',
      phoneNumber: '1234567890',
      address: '123 Test Street',
    };

    it('should create a supplier and add onboarding job to queue', async () => {
      const mockSupplier = {
        id: '1',
        ...createSupplierDto,
        isActive: true,
        createdAt: new Date(),
        devices: [],
      };

      mockPrismaService.supplier.create.mockResolvedValue(mockSupplier);
      mockQueue.add.mockResolvedValue(undefined);

      const result = await service.createSupplier(createSupplierDto);

      expect(result).toEqual(mockSupplier);
      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: createSupplierDto,
      });
      expect(mockQueue.add).toHaveBeenCalledWith('onboard-supplier', {
        supplierId: mockSupplier.id,
        ...createSupplierDto,
      });
    });
  });

  describe('findOneSupplier', () => {
    const mockSupplier = {
      id: '1',
      name: 'Test Supplier',
      contact: '1234567890',
      email: 'test@supplier.com',
      isActive: true,
      createdAt: new Date(),
      devices: [
        {
          id: '1',
          sku: 'TEST-SKU-1',
          brand: 'Test Brand',
          model: 'Test Model',
          price: 1000,
          imei: '123456789',
          lockStatus: LockStatus.UNLOCKED,
          supplierId: '1',
          shopId: null,
          status: DeviceStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it('should return a supplier with devices', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);

      const result = await service.findOneSupplier('1');

      expect(result).toEqual(mockSupplier);
      expect(mockPrismaService.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { devices: true },
      });
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOneSupplier('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSupplier', () => {
    const mockSupplier = {
      id: '1',
      name: 'Test Supplier',
      contact: '1234567890',
      email: 'test@supplier.com',
      isActive: true,
      createdAt: new Date(),
      devices: [],
    };

    const updateDto = {
      name: 'Updated Supplier',
      contact: '0987654321',
    };

    it('should update an active supplier', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.supplier.update.mockResolvedValue({
        ...mockSupplier,
        ...updateDto,
      });

      const result = await service.updateSupplier('1', updateDto);

      expect(result).toEqual({ ...mockSupplier, ...updateDto });
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });

    it('should throw BadRequestException if supplier is inactive', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue({
        ...mockSupplier,
        isActive: false,
      });

      await expect(service.updateSupplier('1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deactivateSupplier', () => {
    const mockSupplier = {
      id: '1',
      name: 'Test Supplier',
      contact: '1234567890',
      email: 'test@supplier.com',
      isActive: true,
      createdAt: new Date(),
      devices: [],
    };

    it('should deactivate an active supplier', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.supplier.update.mockResolvedValue({
        ...mockSupplier,
        isActive: false,
      });

      const result = await service.deactivateSupplier('1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException if supplier is already inactive', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue({
        ...mockSupplier,
        isActive: false,
      });

      await expect(service.deactivateSupplier('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSupplierPerformanceReport', () => {
    const mockSupplier = {
      id: '1',
      name: 'Test Supplier',
      contact: '1234567890',
      email: 'test@supplier.com',
      isActive: true,
      createdAt: new Date(),
      devices: [],
    };

    const mockDevices = [
      {
        id: '1',
        sku: 'TEST-SKU-1',
        brand: 'Test Brand',
        model: 'Test Model',
        price: 1000,
        imei: '123456789',
        lockStatus: LockStatus.UNLOCKED,
        supplierId: '1',
        shopId: null,
        status: DeviceStatus.SOLD,
        createdAt: new Date(),
        updatedAt: new Date(),
        loans: [],
      },
      {
        id: '2',
        sku: 'TEST-SKU-2',
        brand: 'Test Brand',
        model: 'Test Model 2',
        price: 2000,
        imei: '987654321',
        lockStatus: LockStatus.UNLOCKED,
        supplierId: '1',
        shopId: null,
        status: DeviceStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        loans: [],
      },
    ];

    it('should generate performance report for supplier', async () => {
      mockPrismaService.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrismaService.device.findMany.mockResolvedValue(mockDevices);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getSupplierPerformanceReport(
        '1',
        startDate,
        endDate,
      );

      expect(result).toEqual({
        supplier: mockSupplier,
        period: { startDate, endDate },
        totalDevices: 2,
        totalValue: 3000,
        totalSales: 1,
        totalSalesValue: 1000,
        devices: mockDevices,
      });

      expect(mockPrismaService.device.findMany).toHaveBeenCalledWith({
        where: {
          supplierId: '1',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          loans: true,
        },
      });
    });
  });
}); 