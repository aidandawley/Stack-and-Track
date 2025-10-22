package com.stacktrack.repo;

import com.stacktrack.model.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByUidOrderByCreatedAtDesc(String uid);
}
