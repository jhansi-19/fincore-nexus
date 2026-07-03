package com.fincore.customer.service;

import com.fincore.customer.entity.Customer;
import com.fincore.customer.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        if (customerRepository.findByEmail(customer.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + customer.getEmail());
        }
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(UUID id, Customer updatedCustomer) {
        Customer existing = getCustomerById(id);
        existing.setFirstName(updatedCustomer.getFirstName());
        existing.setLastName(updatedCustomer.getLastName());
        existing.setPhone(updatedCustomer.getPhone());
        existing.setDateOfBirth(updatedCustomer.getDateOfBirth());
        existing.setAddress(updatedCustomer.getAddress());
        existing.setCity(updatedCustomer.getCity());
        existing.setState(updatedCustomer.getState());
        existing.setPostalCode(updatedCustomer.getPostalCode());
        existing.setCountry(updatedCustomer.getCountry());
        existing.setCustomerType(updatedCustomer.getCustomerType());
        
        // Only update email if it changed and is unique
        if (!existing.getEmail().equalsIgnoreCase(updatedCustomer.getEmail())) {
            if (customerRepository.findByEmail(updatedCustomer.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists: " + updatedCustomer.getEmail());
            }
            existing.setEmail(updatedCustomer.getEmail());
        }
        
        return customerRepository.save(existing);
    }

    @Transactional
    public Customer updateKycStatus(UUID id, String kycStatus) {
        Customer existing = getCustomerById(id);
        String status = kycStatus.toUpperCase();
        if (!status.equals("PENDING") && !status.equals("IN_REVIEW") && !status.equals("VERIFIED") && !status.equals("REJECTED")) {
            throw new RuntimeException("Invalid KYC status: " + kycStatus);
        }
        existing.setKycStatus(status);
        return customerRepository.save(existing);
    }

    public Map<String, Object> getDashboardStats() {
        List<Customer> all = customerRepository.findAll();
        long totalCustomers = all.size();
        long verifiedCustomers = all.stream().filter(c -> "VERIFIED".equals(c.getKycStatus())).count();
        long pendingKyc = all.stream().filter(c -> "PENDING".equals(c.getKycStatus()) || "IN_REVIEW".equals(c.getKycStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", totalCustomers);
        stats.put("verifiedCustomers", verifiedCustomers);
        stats.put("pendingKyc", pendingKyc);
        return stats;
    }
}
